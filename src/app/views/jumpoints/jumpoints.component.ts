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
import { JumpointNameParser, ParsedJumpointName } from "./helpers/jumpoint-name-parser";
import { JumpointNodeBusinessUnit } from "./enums";
import { AppService } from "app/app.service";

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
    private deploymentNodes = new Map<string, JumpointDeploymentNode>();
    private downloadingIsoIds = new Set<number>();
    public expandedJumpointId: number | null = null;

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly jumpointsService: JumpointsService,
        private readonly appService: AppService,
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

    // ── Deployment node helpers ───────────────────────────────────────────────

    /** Map key used to correlate Jumpoint codeName to a DeploymentNode */
    private nodeKey(businessUnit: string, siteKey: string): string {
        return `${businessUnit}:${siteKey}`;
    }

    /** Returns the deployment node linked to this jumpoint (or undefined) */
    public getDeploymentNode(jumpoint: Jumpoint): JumpointDeploymentNode | undefined {
        const parsed = JumpointNameParser.parse(jumpoint.codeName);
        if (!parsed) return undefined;
        return this.deploymentNodes.get(this.nodeKey(parsed.businessUnit, parsed.siteKey));
    }

    /** True if the jumpoint codeName follows the Marlink naming convention */
    public isDeployable(jumpoint: Jumpoint): boolean {
        return !!JumpointNameParser.parse(jumpoint.codeName);
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
            return JumpointNameParser.parse(jumpoint.codeName) ? "–" : "N/A";
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
        if (node.isoFilePath && jumpoint.isConnected) return "#4caf50"; // green — online
        if (node.isoFilePath) return "#2196f3"; // blue — ISO ready
        return "#ff9800"; // amber — partially deployed
    }

    /** Toggle the expandable detail row for a jumpoint that has a deployment node */
    public toggleExpand(jumpoint: Jumpoint): void {
        const node = this.getDeploymentNode(jumpoint);
        if (!node) return; // Only expand rows with an existing node
        this.expandedJumpointId = this.expandedJumpointId === jumpoint.id ? null : jumpoint.id;
    }

    /** True if a browser ISO download is in progress for the given node */
    public isDownloadingIso(node: JumpointDeploymentNode): boolean {
        return this.downloadingIsoIds.has(node.id);
    }

    /** Trigger browser download of the ISO file for a fully-deployed node */
    public async downloadIsoHandler(node: JumpointDeploymentNode): Promise<void> {
        if (this.downloadingIsoIds.has(node.id)) return;
        this.downloadingIsoIds.add(node.id);
        try {
            await this.jumpointsService.downloadDeploymentIsoFile(node.id, node.certname);
        } catch (err: any) {
            this.errorDialog.show({
                title: "ISO Download Failed",
                message: err?.message ?? "Failed to download the ISO file. Please try again.",
            });
        } finally {
            this.downloadingIsoIds.delete(node.id);
        }
    }

    // ── Deploy overlay ────────────────────────────────────────────────────────

    public openDeployOverlay(jumpoint: Jumpoint): void {
        const parsed: ParsedJumpointName | null = JumpointNameParser.parse(jumpoint.codeName);
        if (!parsed) return;

        const existingNode = this.getDeploymentNode(jumpoint);

        const dialogData: JumpointDeployDialogData = {
            jumpointName: jumpoint.codeName ?? jumpoint.name,
            siteKey: parsed.siteKey,
            businessUnit: parsed.businessUnit as JumpointNodeBusinessUnit,
            existingNode,
        };

        const dialogRef = this.dialog.open(JumpointDeployOverlayComponent, {
            data: dialogData,
            disableClose: true,
            width: "520px",
        });

        dialogRef.afterClosed().subscribe((updatedNode: JumpointDeploymentNode | undefined) => {
            if (updatedNode) {
                // Merge the freshly deployed node back into our local map
                this.deploymentNodes.set(this.nodeKey(updatedNode.businessUnit, updatedNode.siteKey), updatedNode);
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
                await this.jumpointsService.deleteJumpoint(this.currentTenantId, jumpoint.id);
                this.notificationDialog.show({
                    message: `Jumpoint "${jumpoint.name}" has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Jumpoint Failed",
                    message: err?.message || "The jumpoint could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn("No BeyondTrust instance selected, skipping jumpoints load");
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            // Fetch jumpoints AND deployment nodes in parallel.
            // Deployment node failures are silenced — the table still renders without them.
            const [items, deploymentNodesList] = await Promise.all([
                this.jumpointsService.fetchJumpoints(tenantId),
                this.jumpointsService.fetchDeploymentNodes().catch(() => [] as JumpointDeploymentNode[]),
            ]);

            // Rebuild the keyed map for fast O(1) lookups per row
            this.deploymentNodes.clear();
            for (const node of deploymentNodesList) {
                this.deploymentNodes.set(this.nodeKey(node.businessUnit, node.siteKey), node);
            }

            const filteredItems = PraDataFilter.filterByBusinessUnit(items, this.currentBusinessUnit, [
                (j) => j.codeName,
            ]);
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
        // Reload when the user switches BeyondTrust instance
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((instanceId) => {
                const previousTenantId = this.currentTenantId;
                this.currentTenantId = instanceId;

                if (previousTenantId !== null && previousTenantId !== instanceId) {
                    this.loadPage();
                }
            }),
        );
    }
}
