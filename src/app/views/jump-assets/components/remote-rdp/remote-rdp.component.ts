import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraBaseComponent } from "../../../../shared/components/pra-base/pra-base.component";
import { ConfirmDialogService } from "../../../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../../../shared/dialogs/notification-dialog/notification-dialog.service";
import { PraDataFilter } from "../../../../shared/helpers";
import { JumpAssetsService } from "../../jump-assets.service";
import { JumpAssetCopyOverlayComponent } from "../jump-asset-copy-overlay/jump-asset-copy-overlay.component";
import {
    JumpAssetUpdateDialogData,
    JumpAssetUpdateOverlayComponent,
} from "../jump-asset-update-overlay/jump-asset-update-overlay.component";
import {
    CreateRemoteRdpDtoInput,
    JumpAssetCopyRequest,
    JumpAssetCreateRequest,
    JumpAssetUpdateRequest,
    RemoteRdp,
} from "../../models";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpointsService } from "../../../jumpoints/jumpoints.service";
import { JumpGroup } from "../../../jump-groups/models";
import { JumpPolicy } from "../../../jump-policies/models";
import { Jumpoint } from "../../../jumpoints/models";

import {
    JumpAssetCreateDialogData,
    JumpAssetCreateOverlayComponent,
} from "../jump-asset-create-overlay/jump-asset-create-overlay.component";
import { JumpGroupType } from "../../enums";
import { AppService } from "../../../../app.service";

@Component({
    selector: "app-remote-rdp",
    templateUrl: "./remote-rdp.component.html",
    styleUrls: ["./remote-rdp.component.scss"],
})
export class RemoteRdpComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "jumpGroupName",
        "tag",
        "hostname",
        "name",
        "jumpointName",
        "jumpPolicyName",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<RemoteRdp>();
    public defaultPageSize = RemoteRdpComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = RemoteRdpComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = RemoteRdpComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private jumpGroups: JumpGroup[] = [];
    private jumpPolicies: JumpPolicy[] = [];
    private jumpoints: Jumpoint[] = [];

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly jumpAssetsService: JumpAssetsService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
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

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    public async copyRemoteRdpHandler(asset: RemoteRdp): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message: "Please select a BeyondTrust instance before copying.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetCopyOverlayComponent, {
            data: {
                assetType: "remoteRdp",
                assetId: asset.id,
                defaultName: asset.name,
                tenantId: this.currentTenantId,
            },
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetCopyRequest | null) => {
                if (result && this.currentTenantId) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.copyRemoteRdp(
                            this.currentTenantId,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: `Remote RDP "${result.name}" successfully copied to Jump Group ID "${result.jumpGroupId}".`,
                        });
                        await this.loadPage();
                    } catch (error) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message:
                                (error as any)?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async addRemoteRdpHandler(): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message:
                    "Please select a BeyondTrust instance before creating.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetCreateOverlayComponent, {
            data: {
                assetType: "remoteRdp",
                tenantId: this.currentTenantId,
            } as JumpAssetCreateDialogData,
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetCreateRequest | null) => {
                if (result && this.currentTenantId) {
                    this.isLoading = true;
                    try {
                        const body: CreateRemoteRdpDtoInput = {
                            name: result.name,
                            tag: result.tag,
                            hostname: result.hostname ?? "",
                            jumpGroupId: result.jumpGroupId!,
                            jumpointId: result.jumpointId!,
                            jumpPolicyId: result.jumpPolicyId ?? 0,
                        };

                        await this.jumpAssetsService.createRemoteRdp(
                            this.currentTenantId,
                            body,
                        );
                        this.notificationDialog.show({
                            message: `Remote RDP "${result.name}" successfully created.`,
                        });
                        await this.loadPage();
                    } catch (error) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message:
                                (error as any)?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async editRemoteRdpHandler(asset: RemoteRdp): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message: "Please select a BeyondTrust instance before editing.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetUpdateOverlayComponent, {
            data: {
                assetType: "remoteRdp",
                assetId: asset.id,
                currentName: asset.name,
                currentTag: asset.tag,
                currentHostname: asset.hostname,
                currentJumpGroupId: asset.jumpGroupId,
                currentJumpGroupType: asset.jumpGroupType,
                currentJumpPolicyId: asset.jumpPolicyId,
                tenantId: this.currentTenantId,
            } as JumpAssetUpdateDialogData,
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetUpdateRequest | null) => {
                if (result && this.currentTenantId) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.updateRemoteRdp(
                            this.currentTenantId,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: `Remote RDP "${result.name}" successfully updated.`,
                        });
                        await this.loadPage();
                    } catch (err: any) {
                        this.errorDialog.show({
                            title: "Error",
                            message: err?.message ?? "Unexpected error",
                        });
                    } finally {
                        this.isLoading = false;
                    }
                }
            });
    }

    public deleteRemoteRdpHandler(asset: RemoteRdp): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message:
                    "Please select a BeyondTrust instance before deleting.",
            });
            return;
        }

        this.confirmDialog
            .show({
                title: "Delete Remote RDP",
                message: `Are you sure you want to delete Remote RDP<br><strong>"${asset.name}"</strong>?`,
            })
            .then(async (confirmed) => {
                if (confirmed && this.currentTenantId) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.deleteRemoteRdp(
                            this.currentTenantId,
                            asset.id,
                        );
                        this.notificationDialog.show({
                            message: `Remote RDP "${asset.name}" successfully deleted.`,
                        });
                        await this.loadPage();
                    } catch (err: any) {
                        this.errorDialog.show({
                            title: "Error",
                            message: err?.message ?? "Unexpected error",
                        });
                    } finally {
                        this.isLoading = false;
                    }
                }
            });
    }

    private async loadPage(
        overrides: Partial<{ pageNumber: number; pageSize: number }> = {},
    ): Promise<void> {
        if (!this.currentTenantId) {
            return;
        }

        this.isLoading = true;

        try {
            // Load all necessary data in parallel
            const [items, jumpGroups, jumpPolicies, jumpoints] =
                await Promise.all([
                    this.jumpAssetsService.fetchRemoteRdps(
                        this.currentTenantId,
                    ),
                    this.jumpGroupsService.fetchJumpGroups(
                        this.currentTenantId,
                    ),
                    this.jumpPoliciesService.fetchJumpPolicies(
                        this.currentTenantId,
                    ),
                    this.jumpointsService.fetchJumpoints(this.currentTenantId),
                ]);

            // Build lookup maps for O(1) enrichment (instead of Array.find per item)
            const jumpGroupMap = new Map(jumpGroups.map((g) => [g.id, g]));
            const jumpPolicyMap = new Map(jumpPolicies.map((p) => [p.id, p]));
            const jumpointMap = new Map(jumpoints.map((j) => [j.id, j]));

            // Store lookup tables (if needed later)
            this.jumpGroups = jumpGroups;
            this.jumpPolicies = jumpPolicies;
            this.jumpoints = jumpoints;

            // Enrich items directly
            const enriched = items.map((item) => ({
                ...item,
                jumpGroupName: jumpGroupMap.get(item.jumpGroupId)?.name ?? "—",
                jumpPolicyName: item.jumpPolicyId
                    ? (jumpPolicyMap.get(item.jumpPolicyId)?.displayName ?? "—")
                    : "—",
                jumpointName: jumpointMap.get(item.jumpointId)?.name ?? "—",
                jumpointCodeName: jumpointMap.get(item.jumpointId)?.codeName,
            }));

            // Filter by jumpoint codeName — SuperAdmins see all, BU Admins
            // see only assets whose jumpoint codeName carries their BU prefix.
            const filteredItems = PraDataFilter.filterByBusinessUnit(
                enriched,
                this.currentBusinessUnit,
                [(j) => j.jumpointCodeName],
            );

            // Optional pagination overrides (if the calling location wants it)
            if (overrides.pageNumber !== undefined && this.paginator) {
                this.paginator.pageIndex = overrides.pageNumber;
            }
            if (overrides.pageSize !== undefined && this.paginator) {
                this.paginator.pageSize = overrides.pageSize;
            }

            // Provide MatTableDataSource
            this.dataSource.data = filteredItems;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredItems.length;

            // Ensure paginator is on a valid page
            if (this.paginator) {
                const maxPageIndex = Math.max(
                    Math.ceil(filteredItems.length / this.paginator.pageSize) -
                        1,
                    0,
                );
                if (this.paginator.pageIndex > maxPageIndex) {
                    this.paginator.firstPage();
                }
            }
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe(
                async (instanceId) => {
                    const previousTenantId = this.currentTenantId;
                    this.currentTenantId = instanceId;
                    // Prevent double-loading on component init: selectedInstanceId$
                    // is a BehaviorSubject that emits immediately on subscribe.
                    // Only reload when the instance actually changes mid-session.
                    if (
                        previousTenantId !== null &&
                        previousTenantId !== instanceId
                    ) {
                        await this.loadPage();
                    }
                },
            ),
        );
    }
}
