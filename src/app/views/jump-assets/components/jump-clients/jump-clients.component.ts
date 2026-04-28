import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { PraBaseComponent } from "../../../../shared/components/pra-base/pra-base.component";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { ConfirmDialogService } from "../../../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JumpAssetsService } from "../../jump-assets.service";
import { JumpAssetCopyOverlayComponent } from "../jump-asset-copy-overlay/jump-asset-copy-overlay.component";
import {
    JumpAssetUpdateDialogData,
    JumpAssetUpdateOverlayComponent,
} from "../jump-asset-update-overlay/jump-asset-update-overlay.component";
import {
    JumpAssetCopyRequest,
    JumpAssetUpdateRequest,
    JumpClient,
} from "../../models";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { AppService } from "../../../../app.service";

@Component({
    selector: "app-jump-clients",
    templateUrl: "./jump-clients.component.html",
    styleUrls: ["./jump-clients.component.scss"],
})
export class JumpClientsComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "jumpGroupName",
        "tag",
        "hostname",
        "name",
        "jumpPolicyName",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<JumpClient>();
    public defaultPageSize = JumpClientsComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = JumpClientsComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = JumpClientsComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly jumpAssetsService: JumpAssetsService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
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

    public async copyJumpClientHandler(asset: JumpClient): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message: "Please select a BeyondTrust instance before copying.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetCopyOverlayComponent, {
            data: {
                assetType: "jumpClient",
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
                        await this.jumpAssetsService.copyJumpClient(
                            this.currentTenantId,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: `Jump Client "${result.name}" successfully copied to Jump Group ID "${result.jumpGroupId}".`,
                        });
                        await this.loadPage();
                    } catch (error: any) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message: error?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async editJumpClientHandler(asset: JumpClient): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message: "Please select a BeyondTrust instance before editing.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetUpdateOverlayComponent, {
            data: {
                assetType: "jumpClient",
                assetId: asset.id,
                currentName: asset.name,
                currentTag: asset.tag,
                currentHostname: asset.hostname,
                currentJumpGroupId: asset.jumpGroupId,
                currentJumpGroupType: asset.jumpGroupType || "shared",
                currentJumpPolicyId: asset.jumpPolicyId ?? null,
                currentSessionPolicyId: asset.sessionPolicyId ?? null,
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
                        await this.jumpAssetsService.updateJumpClient(
                            this.currentTenantId,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: "Jump Client successfully updated.",
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

    public deleteJumpClientHandler(asset: JumpClient): void {
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
                title: "Delete Jump Client",
                message: `Are you sure you want to delete Jump Client<br><strong>"${asset.name}"</strong>?`,
            })
            .then(async (confirmed) => {
                if (confirmed && this.currentTenantId) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.deleteJumpClient(
                            this.currentTenantId,
                            asset.id,
                        );
                        this.notificationDialog.show({
                            message: `Jump Client "${asset.name}" successfully deleted.`,
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
            this.isLoading = false;
            return;
        }

        this.isLoading = true;

        try {
            // Load all necessary data in parallel
            const [items, jumpGroups, jumpPolicies] = await Promise.all([
                this.jumpAssetsService.fetchJumpClients(this.currentTenantId),
                this.jumpGroupsService.fetchJumpGroups(this.currentTenantId),
                this.jumpPoliciesService.fetchJumpPolicies(
                    this.currentTenantId,
                ),
            ]);

            // Build lookup maps for O(1) enrichment (instead of Array.find per item)
            const jumpGroupMap = new Map(jumpGroups.map((g) => [g.id, g]));
            const jumpPolicyMap = new Map(jumpPolicies.map((p) => [p.id, p]));

            // Enrich items with display names
            const enriched = items.map((item) => ({
                ...item,
                jumpGroupName: jumpGroupMap.get(item.jumpGroupId)?.name ?? "—",
                jumpPolicyName: item.jumpPolicyId
                    ? (jumpPolicyMap.get(item.jumpPolicyId)?.displayName ?? "—")
                    : "—",
            }));

            // Optional pagination overrides
            if (overrides.pageNumber !== undefined && this.paginator) {
                this.paginator.pageIndex = overrides.pageNumber;
            }
            if (overrides.pageSize !== undefined && this.paginator) {
                this.paginator.pageSize = overrides.pageSize;
            }

            // Provide MatTableDataSource
            this.dataSource.data = enriched;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = enriched.length;

            // Ensure paginator is on a valid page
            if (this.paginator) {
                const maxPageIndex = Math.max(
                    Math.ceil(enriched.length / this.paginator.pageSize) - 1,
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
