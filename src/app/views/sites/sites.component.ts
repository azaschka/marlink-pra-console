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
import { SitesService } from "./sites.service";
import { Site } from "./models";
import { ImportExcelOverlayComponent } from "./components/import-excel-overlay/import-excel-overlay.component";
import { Customer } from "../customers/models";
import { CustomersService } from "../customers/customers.service";
import { BusinessUnit } from "../pra-users/enums";
import { PraDataFilter } from "app/shared/helpers";
import { AppService } from "app/app.service";

@Component({
    selector: "app-sites",
    templateUrl: "./sites.component.html",
    styleUrls: ["./sites.component.scss"],
})
export class SitesComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "key",
        "name",
        "customerName",
        "jumpointCodeNames",
        "creationDate",
        "lastModificationDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<Site>();
    public defaultPageSize = SitesComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = SitesComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = SitesComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public loaderMode: "indeterminate" | "buffer" = "indeterminate";
    public filterValue = "";
    public dataCount = 0;

    private customers: Customer[] = [];

    private currentBusinessUnit: BusinessUnit | null | undefined;
    private currentTenantId: number | null = null;

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly dialog: MatDialog,
        private readonly jwtAuthService: JwtAuthService,
        private readonly sitesService: SitesService,
        private readonly customersService: CustomersService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly appService: AppService
    ) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
        this.jwtAuthService.getPraUser();
        this.addListeners();

        // Initialize AppService and get tenant ID
        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();

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

    public downloadTemplateHandler(): void {
        const link = document.createElement("a");
        link.href = "assets/templates/PRA Ingestion Template.xlsx";
        link.download = "PRA Ingestion Template.xlsx";
        link.click();
    }

    public importExcelHandler(): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select an instance before importing data.",
            });
            return;
        }

        this.dialog
            .open(ImportExcelOverlayComponent, {
                data: { tenantId: this.currentTenantId },
                disableClose: true,
            })
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.loadPage();
                }
            });
    }

    public addSiteHandler(): void {
        // TODO: Overlay für Add Site
    }

    public async deleteSiteHandler(site: Site): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Site",
            message: `Are you sure you want to delete site:<br><strong>${site.name} (${site.key})</strong>?<br><br>This action <strong>cannot be undone.</strong> All data associated with this site will be permanently deleted and cannot be recovered.`,
        });
        if (confirmed) {
            this.isLoading = true;
            this.loaderMode = "buffer";
            try {
                await this.sitesService.deleteSite(site.id);
                this.notificationDialog.show({
                    message: `Site ${site.name} has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Site Failed",
                    message:
                        err?.message ??
                        "The site could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        this.loaderMode = "indeterminate";
        try {
            const [sites, customers] = await Promise.all([
                this.sitesService.fetchSites(),
                this.customersService.fetchCustomers(),
            ]);
            this.customers = customers;
            const customerBUByKey = new Map(
                this.customers.map((c) => [c.key, c.businessUnit])
            );
            const filteredSites = PraDataFilter.filterByBusinessUnit(
                sites,
                this.currentBusinessUnit,
                [(site) => customerBUByKey.get(site.customerKey) ?? undefined]
            );

            this.dataSource.data = filteredSites;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredSites.length;

            setTimeout(() => this.loadVisibleJumpointCodeNames(), 10);
            // this.paginator.page.subscribe(() =>
            //     this.loadVisibleJumpointCodeNames()
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

    private loadVisibleJumpointCodeNames(): void {
        const data = this.dataSource.filteredData || this.dataSource.data;
        const pageIndex = this.paginator.pageIndex || 0;
        const pageSize = this.paginator.pageSize || 20;
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        const currentPageItems = data; // data.slice(start, end);

        for (const site of currentPageItems) {
            if (
                site.jumpPointCodeName === undefined &&
                !site.jumpPointCodeName?.includes("Loading")
            ) {
                site.jumpPointCodeName = "Loading ...";
                this.sitesService
                    .fetchSiteJumpoints(site.id)
                    .then((res) => {
                        if (res.length) {
                            site.jumpPointCodeName = res
                                .map((j) => j.codeName)
                                .join(", ");
                        } else {
                            site.jumpPointCodeName = "Not Available";
                        }
                    })
                    .catch(() => {
                        site.jumpPointCodeName = "Not Available";
                    });
            }

            if (site.customerKey) {
                const customer = this.customers.find(
                    (c) => c.key === site.customerKey
                );
                site.customerName = customer ? customer.name : "—";
            } else {
                site.customerName = "—";
            }
        }
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                if (!user || user.role === "None") {
                    this.jwtAuthService.checkTokenIsValid();
                }

                this.currentBusinessUnit = user.businessUnit;
            })
        );
    }
}
