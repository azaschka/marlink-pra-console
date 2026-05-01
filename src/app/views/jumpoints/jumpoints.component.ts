import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";

import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../shared/helpers/pra-data-filter";
import { JumpointsService } from "./jumpoints.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { Jumpoint, JumpointDeploymentNode } from "./models";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JumpointInstallerDownloadOverlayComponent } from "./components/jumpoint-installer-download-overlay/jumpoint-installer-download-overlay.component";
import {
    JumpointDeployOverlayComponent,
    JumpointDeployDialogData,
} from "./components/jumpoint-deploy-overlay/jumpoint-deploy-overlay.component";
import {
    JumpointNodeInfoOverlayComponent,
    JumpointNodeInfoDialogData,
} from "./components/jumpoint-node-info-overlay/jumpoint-node-info-overlay.component";
import { JumpointNodeBusinessUnit } from "./enums";
import { AppService } from "app/app.service";
import { CustomerCacheService } from "../customers/customer-cache.service";
import { Customer } from "../customers/models";
import { SitesService } from "../sites/sites.service";
import { Site } from "../sites/models";

@Component({
    selector: "app-jumpoints",
    templateUrl: "./jumpoints.component.html",
    styleUrls: ["./jumpoints.component.scss"],
})
export class JumpointsComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "isConnected",
        "name",
        "codeName",
        "platformType",
        "deploymentStatus",
        "lastSyncDate",
        "actions",
        // Note: "expandedDetail" removed — deployment details shown via overlay instead
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public trackById = (_: number, row: { id: number }) => row.id;

    public dataSource = new MatTableDataSource<Jumpoint>();
    public defaultPageSize = JumpointsComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = JumpointsComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = JumpointsComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    // ── Deployment state ──────────────────────────────────────────────────────
    /** Deployment nodes keyed by siteKey (matches Site.key) */
    private deploymentNodes = new Map<string, JumpointDeploymentNode>();
    /** Sites keyed by site key — only sites accessible to the current user */
    private sitesByKey = new Map<string, Site>();
    /** Customers keyed by customer key */
    private customersByKey = new Map<string, Customer>();
    private downloadingIsoIds = new Set<number>();

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly jumpointsService: JumpointsService,
        private readonly appService: AppService,
        private readonly customerCacheService: CustomerCacheService,
        private readonly sitesService: SitesService,
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
        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();
        this.addListeners();
        await this.loadPage();
    }

    // ── Filter helpers ────────────────────────────────────────────────────────

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    // ── Site-key extraction ───────────────────────────────────────────────────

    /**
     * Extracts the potential site key from a jumpoint name.
     *
     * Marlink naming convention: {BU}_JPOI1_{CustomerName}_{SiteName}_{SiteKey}
     * Example: "MT_JPOI1_GANI_INC_DANNY_1_77771" → "77771"
     *
     * The site key is always the LAST underscore-separated segment.
     * A jumpoint is only considered deployable if this extracted key
     * actually exists in the known sites list.
     */
    private extractSiteKey(name: string | undefined | null): string | null {
        if (!name) return null;
        const parts = name.split("_");
        if (parts.length < 2) return null;
        const last = parts[parts.length - 1];
        return last || null;
    }

    /**
     * Returns the JumpointNodeBusinessUnit for a given site key by looking
     * up the site → customer → businessUnit chain.
     */
    private getBusinessUnitForSiteKey(
        siteKey: string,
    ): JumpointNodeBusinessUnit | null {
        const site = this.sitesByKey.get(siteKey);
        if (!site) return null;
        const customer = this.customersByKey.get(site.customerKey);
        if (!customer) return null;
        // CustomerBusinessUnit and JumpointNodeBusinessUnit share identical values
        return customer.businessUnit as unknown as JumpointNodeBusinessUnit;
    }

    // ── Deployment node helpers ───────────────────────────────────────────────

    /**
     * Returns the deployment node for this jumpoint by extracting the site
     * key from the name and looking it up in the deployment nodes map.
     */
    public getDeploymentNode(
        jumpoint: Jumpoint,
    ): JumpointDeploymentNode | undefined {
        const siteKey = this.extractSiteKey(jumpoint.name);
        if (!siteKey) return undefined;
        return this.deploymentNodes.get(siteKey);
    }

    /**
     * True if the jumpoint's site key exists in the known sites set.
     * Jumpoints whose site key is not in the sites list are ignored
     * (they belong to a site we don't manage or don't know about).
     */
    public isDeployable(jumpoint: Jumpoint): boolean {
        const siteKey = this.extractSiteKey(jumpoint.name);
        if (!siteKey) return false;
        return this.sitesByKey.has(siteKey);
    }

    /** True when no deployment node exists yet — show the Deploy button */
    public canDeploy(jumpoint: Jumpoint): boolean {
        return this.isDeployable(jumpoint) && !this.getDeploymentNode(jumpoint);
    }

    /** True when a node exists but ISO has not been generated — show Retry */
    public canRetry(jumpoint: Jumpoint): boolean {
        const node = this.getDeploymentNode(jumpoint);
        return !!node && !node.isoFilePath;
    }

    /** True when the ISO is ready but the jumpoint is not yet connected — show Download ISO */
    public canDownloadIso(jumpoint: Jumpoint): boolean {
        const node = this.getDeploymentNode(jumpoint);
        return !!node && !!node.isoFilePath && !jumpoint.isConnected;
    }

    /** True when deployment is complete and the jumpoint is online — show Online badge */
    public isFullyOnline(jumpoint: Jumpoint): boolean {
        const node = this.getDeploymentNode(jumpoint);
        return !!node && !!node.isoFilePath && !!jumpoint.isConnected;
    }

    /** Short status label for the "Node Status" column */
    public getDeploymentStatusLabel(jumpoint: Jumpoint): string {
        const node = this.getDeploymentNode(jumpoint);
        if (!node) {
            return this.isDeployable(jumpoint) ? "–" : "N/A";
        }
        if (node.isoFilePath && jumpoint.isConnected) return "Online";
        if (node.isoFilePath) return "ISO Ready";
        if (node.hasApproval) return "Approved";
        if (node.serviceType) return "Service Assigned";
        return "Created";
    }

    /** Material icon name for the deployment status */
    public getDeploymentStatusIcon(jumpoint: Jumpoint): string {
        const node = this.getDeploymentNode(jumpoint);
        if (!node) return "";
        if (node.isoFilePath && jumpoint.isConnected) return "cloud_done";
        if (node.isoFilePath) return "cloud_download";
        if (node.hasApproval) return "verified";
        if (node.serviceType) return "settings";
        return "pending";
    }

    /** CSS colour for the deployment status icon */
    public getDeploymentStatusColor(jumpoint: Jumpoint): string {
        const node = this.getDeploymentNode(jumpoint);
        if (!node) return "rgba(0,0,0,0.38)";
        if (node.isoFilePath && jumpoint.isConnected) return "#4caf50";
        if (node.isoFilePath) return "#2196f3";
        return "#ff9800";
    }

    /** Open the deployment info overlay for a jumpoint that has a deployment node */
    public openNodeInfoOverlay(jumpoint: Jumpoint): void {
        const node = this.getDeploymentNode(jumpoint);
        if (!node) return;

        const dialogData: JumpointNodeInfoDialogData = {
            jumpointName: jumpoint.name,
            node,
        };

        this.dialog.open(JumpointNodeInfoOverlayComponent, {
            data: dialogData,
            width: "480px",
        });
    }

    /** True if a browser ISO download is in progress for the given node */
    public isDownloadingIso(node: JumpointDeploymentNode): boolean {
        return this.downloadingIsoIds.has(node.id);
    }

    /** Trigger browser download of the ISO file for a fully-deployed node */
    public async downloadIsoHandler(
        node: JumpointDeploymentNode,
    ): Promise<void> {
        if (this.downloadingIsoIds.has(node.id)) return;
        this.downloadingIsoIds.add(node.id);
        try {
            await this.jumpointsService.downloadDeploymentIsoFile(
                node.id,
                node.certname,
            );
        } catch (err: any) {
            this.errorDialog.show({
                title: "ISO Download Failed",
                message:
                    err?.message ??
                    "Failed to download the ISO file. Please try again.",
            });
        } finally {
            this.downloadingIsoIds.delete(node.id);
        }
    }

    // ── Deploy overlay ────────────────────────────────────────────────────────

    public openDeployOverlay(jumpoint: Jumpoint): void {
        const siteKey = this.extractSiteKey(jumpoint.name);
        if (!siteKey) return;

        // Get businessUnit from the site's customer — no name-parsing guesswork.
        const businessUnit = this.getBusinessUnitForSiteKey(siteKey);
        if (!businessUnit) return;

        const existingNode = this.getDeploymentNode(jumpoint);

        const dialogData: JumpointDeployDialogData = {
            jumpointName: jumpoint.name,
            siteKey,
            businessUnit,
            existingNode,
        };

        const dialogRef = this.dialog.open(JumpointDeployOverlayComponent, {
            data: dialogData,
            disableClose: true,
            width: "520px",
        });

        dialogRef
            .afterClosed()
            .subscribe((updatedNode: JumpointDeploymentNode | undefined) => {
                if (updatedNode) {
                    // Merge the freshly deployed node back into our local map
                    this.deploymentNodes.set(updatedNode.siteKey, updatedNode);
                }
            });
    }

    // ── LEGACY installer download (preserved for future use) ─────────────────

    // public isDownloadDisabled(jumpoint: Jumpoint): boolean {
    //     return !jumpoint.keyInfo;
    // }

    // public async downloadJumpointInstallerHandler(jumpoint: Jumpoint): Promise<void> {
    //     if (!this.currentTenantId) {
    //         this.errorDialog.show({
    //             title: "No Instance Selected",
    //             message: "Please select a BeyondTrust instance first.",
    //         });
    //         return;
    //     }
    //     this.dialog.open(JumpointInstallerDownloadOverlayComponent, {
    //         data: {
    //             jumpointId: jumpoint.id,
    //             jumpointName: jumpoint.name,
    //             tenantId: this.currentTenantId,
    //         },
    //         disableClose: true,
    //     });
    // }

    // ── Delete ────────────────────────────────────────────────────────────────

    public async deleteJumpointHandler(jumpoint: Jumpoint): Promise<void> {
        if (!this.currentTenantId) {
            await this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Delete Jumpoint",
            message: `Are you sure you want to delete:<br><strong>${jumpoint.name}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.jumpointsService.deleteJumpoint(
                    this.currentTenantId,
                    jumpoint.id,
                );
                this.notificationDialog.show({
                    message: `Jumpoint "${jumpoint.name}" has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Jumpoint Failed",
                    message:
                        err?.message ||
                        "The jumpoint could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn(
                "No BeyondTrust instance selected, skipping jumpoints load",
            );
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            // All four fetches run in parallel. Sites + customers failures are
            // silenced so the table still renders without deployment features.
            const [items, deploymentNodesList, customers, sites] =
                await Promise.all([
                    this.jumpointsService.fetchJumpoints(tenantId),
                    this.jumpointsService
                        .fetchDeploymentNodes()
                        .catch((): JumpointDeploymentNode[] => []),
                    this.customerCacheService
                        .fetchCustomers()
                        .catch((): Customer[] => []),
                    this.sitesService
                        .fetchSites({ pageSize: 9999 })
                        .catch((): Site[] => []),
                ]);

            // Build site key → deployment node map
            this.deploymentNodes.clear();
            for (const node of deploymentNodesList) {
                this.deploymentNodes.set(node.siteKey, node);
            }

            // Build site key → site map (only sites the user can access)
            this.sitesByKey.clear();
            for (const site of sites) {
                this.sitesByKey.set(site.key, site);
            }

            // Build customer key → customer map (for BU lookup)
            this.customersByKey.clear();
            for (const customer of customers) {
                this.customersByKey.set(customer.key, customer);
            }

            const filteredItems = PraDataFilter.filterByBusinessUnit(
                items,
                this.currentBusinessUnit,
                [(j) => j.codeName],
            );
            this.dataSource.data = filteredItems;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredItems.length;
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    // ── Listeners ─────────────────────────────────────────────────────────────

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((instanceId) => {
                const previousTenantId = this.currentTenantId;
                this.currentTenantId = instanceId;

                if (
                    previousTenantId !== null &&
                    previousTenantId !== instanceId
                ) {
                    this.loadPage();
                }
            }),
        );
    }
}
