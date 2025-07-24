import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { CustomersService } from "./customers.service";
import { Customer } from "./models";
import {
    CustomerOverlayComponent,
    CustomerOverlayDialogData,
} from "./components/customer-overlay/customer-overlay.component";

@Component({
    selector: "app-customers",
    templateUrl: "./customers.component.html",
    styleUrls: ["./customers.component.scss"],
})
export class CustomersComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "isDeactivated",
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

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly dialog: MatDialog,
        private readonly jwtAuthService: JwtAuthService,
        private readonly customersService: CustomersService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
    ) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
        this.jwtAuthService.getPraUser();
        this.addListeners();
        await this.loadPage();
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
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
                    this.loadPage();
                }
            });
    }

    public async deactivateCustomerHandler(customer: Customer): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Deactivate Customer",
            message: `Are you sure you want to deactivate customer:<br><strong>${customer.name} (${customer.key})</strong>?<br><br>The deactivation <strong>cannot be undone!</strong>`,
        });
        if (confirmed) {
            this.isLoading = true;
            try {
                await this.customersService.deactivateCustomer(customer.id);
                this.notificationDialog.show({
                    message: `Customer "${customer.name}" has been deactivated.`,
                });
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

    public async reactivateCustomerHandler(user: Customer): Promise<void> {
        await this.confirmDialog.show({
            title: "Reactivate Customer",
            message: `Reactivating a customer is not implemented yet.`,
        });
    }

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        try {
            const items = await this.customersService.fetchCustomers();

            for (const c of items) {
                c.licenseUsageLoading = false;
                c.totalLicenseUsage = undefined;
            }

            this.dataSource.data = items;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = items.length;

            setTimeout(() => this.loadVisibleLicenseUsages(), 10);
            // this.paginator.page.subscribe(() =>
            //     this.loadVisibleLicenseUsages()
            // );
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private async loadVisibleLicenseUsages() {
        const data = this.dataSource.filteredData || this.dataSource.data;
        const pageIndex = this.paginator.pageIndex || 0;
        const pageSize = this.paginator.pageSize || 20;
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        const currentPageItems = data; // data.slice(start, end);

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

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                if (!user || user.role === "None") {
                    this.jwtAuthService.checkTokenIsValid();
                }
            })
        );
    }
}
