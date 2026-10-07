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
import { SitesService } from "./sites.service";
import { Site } from "./models";
import { ImportExcelOverlayComponent } from "./components/import-excel-overlay/import-excel-overlay.component";
import { Customer } from "../customers/models";
import { CustomerCacheService } from "../customers/customer-cache.service";
import { PraDataFilter } from "app/shared/helpers";
import { AppService } from "app/app.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";

import { SiteErrorReportFormatter } from "./helpers/site-error-report.formatter";
@Component({
    selector: "app-sites",
    templateUrl: "./sites.component.html",
    styleUrls: ["./sites.component.scss"],
})
export class SitesComponent
    extends PraBaseComponent
    implements OnInit, AfterViewInit
{
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "key",
        "name",
        "customerName",
        "jumpointCodeNames",
        "totalLicenseUsage",
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
    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly sitesService: SitesService,
        private readonly customerCacheService: CustomerCacheService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly appService: AppService,
    ) {
        super(jwtAuthService);
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
    }

    public async ngOnInit(): Promise<void> {
        // Initialize AppService and get tenant ID
        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();

        await this.loadPage();
    }

    public ngAfterViewInit(): void {
        this.subscriptionsToClear.add(
            this.paginator.page
                .pipe(debounceTime(200))
                .subscribe(() => this.loadVisibleSiteDetails()),
        );
    }

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
        this.loadVisibleSiteDetails();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    public async downloadTemplateHandler(): Promise<void> {
        try {
            const blob = await this.sitesService.downloadImportTemplate();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "PRA Ingestion Template.xlsx";
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            this.errorDialog.show({
                title: "Template Download Failed",
                message:
                    err?.message ??
                    "The import template could not be downloaded. Please try again later.",
            });
        }
    }

    public importExcelHandler(): void {
        this.dialog
            .open(ImportExcelOverlayComponent, {
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
            message:
                `Are you sure you want to delete site:<br><strong>${site.name} (${site.key})</strong>?<br><br>` +
                `This action <strong>cannot be undone.</strong> All data associated with this site will be permanently deleted and cannot be recovered.<br><br>` +
                `Users of this site: their memberships for this site are removed. Accounts, local and external, are deleted when they hold no other site role. ` +
                `BeyondTrust creates an external account (provisioned by an identity provider) again when the user signs in the next time; access through identity provider groups is not changed.`,
        });
        if (confirmed) {
            this.isLoading = true;
            this.loaderMode = "buffer";
            try {
                const result = await this.sitesService.deleteSite(site.id);
                const cleanupItems = SiteErrorReportFormatter.itemsOf(result);
                if (cleanupItems.length > 0) {
                    // R3.2-A005: the site is gone, but some BeyondTrust artefacts could not be removed.
                    this.errorDialog.show({
                        title: "Site deleted with cleanup warnings",
                        message:
                            `Site <strong>${site.name}</strong> has been deleted, but ${cleanupItems.length} item(s) could not be cleaned up in BeyondTrust and need manual attention:` +
                            SiteErrorReportFormatter.formatHtmlList(cleanupItems),
                    });
                } else {
                    this.notificationDialog.show({
                        message: `Site ${site.name} has been deleted.`,
                    });
                }
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
            // TODO: Replace with server-side pagination once client-side (pageSize=9999) is removed.
            // const pageNumber = (this.paginator?.pageIndex ?? 0) + 1;
            // const pageSize = this.paginator?.pageSize ?? SitesComponent.DEFAULT_PAGE_SIZE;
            const [sites, customers] = await Promise.all([
                this.sitesService.fetchSites(/* { pageNumber, pageSize } */),
                this.customerCacheService.fetchCustomers(),
            ]);
            this.customers = customers;
            const customerByKey = new Map(
                this.customers.map((c) => [c.key, c]),
            );
            const customerBUByKey = new Map(
                this.customers.map((c) => [c.key, c.businessUnit]),
            );
            const filteredSites = PraDataFilter.filterByBusinessUnit(
                sites,
                this.currentBusinessUnit,
                [(site) => customerBUByKey.get(site.customerKey) ?? undefined],
            );

            for (const site of filteredSites) {
                const customer = customerByKey.get(site.customerKey);
                site.customerName = customer ? customer.name : "—";
                site.jumpPointCodeName = undefined;
                site.totalLicenseUsage = undefined;
                site.licenseUsageLoading = false;
            }

            this.dataSource.data = filteredSites;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredSites.length;

            this.loadVisibleSiteDetails();
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private loadVisibleSiteDetails(): void {
        const data = this.dataSource.filteredData || this.dataSource.data;
        // TODO: Activate slice once server-side pagination is in place (pageSize=9999 → all items loaded, slice not needed).
        // const pageIndex = this.paginator?.pageIndex ?? 0;
        // const pageSize = this.paginator?.pageSize ?? SitesComponent.DEFAULT_PAGE_SIZE;
        // const start = pageIndex * pageSize;
        // const end = start + pageSize;
        // const currentPageItems = data.slice(start, end);
        const currentPageItems = data;

        for (const site of currentPageItems) {
            if (site.jumpPointCodeName === undefined) {
                site.jumpPointCodeName = "Loading ...";
                this.sitesService
                    .fetchSiteJumpoints(site.id)
                    .then((res) => {
                        site.jumpPointCodeName = res.length
                            ? res.map((j) => j.codeName).join(", ")
                            : "Not Available";
                    })
                    .catch(() => {
                        site.jumpPointCodeName = "Not Available";
                    });
            }

            if (
                site.totalLicenseUsage === undefined &&
                !site.licenseUsageLoading
            ) {
                site.licenseUsageLoading = true;
                this.sitesService
                    .calculateLicenseUsage(site.id)
                    .then((res) => {
                        site.totalLicenseUsage = res.totalLicenseUsage;
                    })
                    .catch(() => {
                        site.totalLicenseUsage = undefined;
                    })
                    .finally(() => {
                        site.licenseUsageLoading = false;
                    });
            }
        }
    }
}
