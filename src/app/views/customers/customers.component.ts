import { Component, AfterViewInit, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { debounceTime } from "rxjs/operators";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { CustomersService } from "./customers.service";
import { CustomerCacheService } from "./customer-cache.service";
import { Customer } from "./models";
import {
    CustomerOverlayComponent,
    CustomerOverlayDialogData,
} from "./components/customer-overlay/customer-overlay.component";
import { PraDataFilter } from "app/shared/helpers";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";

@Component({
    selector: "app-customers",
    templateUrl: "./customers.component.html",
    styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent
    extends PraBaseComponent
    implements OnInit, AfterViewInit
{
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "isDeactivated",
        "businessUnit",
        "key",
        "name",
        "totalLicenseUsage",
        "lastModificationDate",
        "creationDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<Customer>();
    public defaultPageSize = CustomersComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = CustomersComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = CustomersComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly customersService: CustomersService,
        private readonly customerCacheService: CustomerCacheService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        super(jwtAuthService);
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
    }

    public async ngOnInit(): Promise<void> {
        await this.loadPage();
    }

    public ngAfterViewInit(): void {
        this.subscriptionsToClear.add(
            this.paginator.page
                .pipe(debounceTime(200))
                .subscribe(() => this.loadVisibleLicenseUsages()),
        );
    }

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
        this.loadVisibleLicenseUsages();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    public addCustomerHandler(): void {
        this.dialog
            .open(CustomerOverlayComponent, {
                data: { mode: "add" } as CustomerOverlayDialogData,
                disableClose: true,
            })
            .afterClosed()
            .subscribe((created: boolean) => {
                if (created) {
                    this.notificationDialog.show({
                        message: "Customer has been created successfully.",
                    });
                    this.customerCacheService.invalidate();
                    this.loadPage();
                }
            });
    }

    public editCustomerHandler(customer: Customer): void {
        this.dialog
            .open(CustomerOverlayComponent, {
                data: { mode: "edit", customer } as CustomerOverlayDialogData,
                disableClose: true,
            })
            .afterClosed()
            .subscribe((updated: boolean) => {
                if (updated) {
                    this.notificationDialog.show({
                        message: `Customer "${customer.name}" updated successfully.`,
                    });
                    this.customerCacheService.invalidate();
                    this.loadPage();
                }
            });
    }

    public async deleteCustomerHandler(customer: Customer): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Customer",
            message: `Are you sure you want to delete customer:<br><strong>${customer.name} (${customer.key})</strong>?<br><br>This action <strong>cannot be undone.</strong> All data associated with this customer will be permanently deleted and cannot be recovered.`,
        });
        if (confirmed) {
            this.isLoading = true;
            try {
                await this.customersService.deleteCustomer(customer.id);
                this.notificationDialog.show({
                    message: `Customer ${customer.name} has been deleted.`,
                });
                this.customerCacheService.invalidate();
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Customer Failed",
                    message:
                        err?.message ??
                        "The customer could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    public async deactivateCustomerHandler(customer: Customer): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Deactivate Customer",
            message: `Are you sure you want to deactivate customer:<br><strong>${customer.name} (${customer.key})</strong>?<br><br>When deactivated, all associated users won't be able to login to the system until the customer is reactivated.`,
        });
        if (confirmed) {
            this.isLoading = true;
            try {
                await this.customersService.deactivateCustomer(customer.id);
                this.notificationDialog.show({
                    message: `Customer "${customer.name}" has been deactivated.`,
                });
                this.customerCacheService.invalidate();
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Deactivate Customer Failed",
                    message:
                        err?.message ||
                        "The customer could not be deactivated. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    public async reactivateCustomerHandler(customer: Customer): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Reactivate Customer",
            message: `Are you sure you want to reactivate customer:<br><strong>${customer.name} (${customer.key})</strong>?`,
        });
        if (confirmed) {
            this.isLoading = true;
            try {
                await this.customersService.reactivateCustomer(customer.id);
                this.notificationDialog.show({
                    message: `Customer "${customer.name}" has been reactivated.`,
                });
                this.customerCacheService.invalidate();
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Reactivate Customer Failed",
                    message:
                        err?.message ||
                        "The customer could not be reactivated. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        try {
            // TODO: Replace with server-side pagination once client-side (pageSize=9999) is removed.
            // const pageNumber = (this.paginator?.pageIndex ?? 0) + 1;
            // const pageSize = this.paginator?.pageSize ?? CustomersComponent.DEFAULT_PAGE_SIZE;
            const items = await this.customerCacheService.fetchCustomers();
            const filteredItems = PraDataFilter.filterByBusinessUnit(
                items,
                this.currentBusinessUnit,
                [(c) => c.businessUnit],
            );

            for (const c of filteredItems) {
                c.licenseUsageLoading = false;
                c.totalLicenseUsage = undefined;
            }

            this.dataSource.data = filteredItems;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredItems.length;

            this.loadVisibleLicenseUsages();
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private loadVisibleLicenseUsages(): void {
        const data = this.dataSource.filteredData || this.dataSource.data;
        // TODO: Activate slice once server-side pagination is in place (pageSize=9999 → all items loaded, slice not needed).
        // const pageIndex = this.paginator?.pageIndex ?? 0;
        // const pageSize = this.paginator?.pageSize ?? CustomersComponent.DEFAULT_PAGE_SIZE;
        // const start = pageIndex * pageSize;
        // const end = start + pageSize;
        // const currentPageItems = data.slice(start, end);
        const currentPageItems = data;

        for (const customer of currentPageItems) {
            if (
                customer.totalLicenseUsage === undefined &&
                !customer.licenseUsageLoading
            ) {
                customer.licenseUsageLoading = true;
                this.customersService
                    .calculateLicenseUsage(customer.id)
                    .then((res) => {
                        customer.totalLicenseUsage = res.totalLicenseUsage;
                    })
                    .catch(() => {
                        customer.totalLicenseUsage = undefined;
                    })
                    .finally(() => {
                        customer.licenseUsageLoading = false;
                    });
            }
        }
    }
}
