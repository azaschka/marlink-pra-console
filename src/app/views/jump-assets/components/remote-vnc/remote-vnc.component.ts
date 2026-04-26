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
import { AppService } from "app/app.service";
import { JumpAssetCopyOverlayComponent } from "../jump-asset-copy-overlay/jump-asset-copy-overlay.component";
import {
    JumpAssetUpdateDialogData,
    JumpAssetUpdateOverlayComponent,
} from "../jump-asset-update-overlay/jump-asset-update-overlay.component";
import {
    CreateRemoteVncDtoInput,
    JumpAssetCopyRequest,
    JumpAssetCreateRequest,
    JumpAssetUpdateRequest,
    RemoteVnc,
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

@Component({
    selector: "app-remote-vnc",
    templateUrl: "./remote-vnc.component.html",
    styleUrls: ["./remote-vnc.component.scss"],
})
export class RemoteVncComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "jumpGroupName",
        "tag",
        "hostname",
        "port",
        "name",
        "jumpointName",
        "jumpPolicyName",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<RemoteVnc>();
    public defaultPageSize = RemoteVncComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = RemoteVncComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = RemoteVncComponent.DISPLAYED_COLUMNS;

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
        this.addListeners();

        // Initialize AppService and get tenant ID
        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();

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

    public async copyRemoteVNCHandler(asset: RemoteVnc): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select an instance before copying assets.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetCopyOverlayComponent, {
            data: {
                tenantId: this.currentTenantId,
                assetType: "remoteVnc",
                assetId: asset.id,
                defaultName: asset.name,
            },
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetCopyRequest | null) => {
                if (result) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.copyRemoteVnc(
                            this.currentTenantId!,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: `Remote VNC "${result.name}" successfully copied to Jump Group ID "${result.jumpGroupId}".`,
                        });
                        await this.loadPage();
                    } catch (error) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message:
                                (error as Error)?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async addRemoteVncHandler(): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select an instance before creating assets.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetCreateOverlayComponent, {
            data: {
                tenantId: this.currentTenantId,
                assetType: "remoteVnc",
            } as JumpAssetCreateDialogData,
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetCreateRequest | null) => {
                if (result) {
                    this.isLoading = true;
                    try {
                        const body: CreateRemoteVncDtoInput = {
                            name: result.name,
                            jumpointId: result.jumpointId,
                            hostname: result.hostname,
                            jumpGroupId: result.jumpGroupId,
                            port: result.port,
                            jumpGroupType: JumpGroupType.Shared,
                            tag: result.tag,
                            comments: "",
                            jumpPolicyId: result.jumpPolicyId,
                            sessionPolicyId: null,
                        } as CreateRemoteVncDtoInput;
                        await this.jumpAssetsService.createRemoteVnc(
                            this.currentTenantId!,
                            body,
                        );
                        this.notificationDialog.show({
                            message: `Remote VNC "${result.name}" successfully created.`,
                        });
                        await this.loadPage();
                    } catch (error) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message:
                                (error as Error)?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async editRemoteVNCHandler(asset: RemoteVnc): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select an instance before editing assets.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpAssetUpdateOverlayComponent, {
            data: {
                tenantId: this.currentTenantId,
                assetType: "remoteVnc",
                assetId: asset.id,
                currentName: asset.name,
                currentTag: asset.tag,
                currentHostname: asset.hostname,
                currentPort: asset.port,
                currentJumpGroupId: asset.jumpGroupId,
                currentJumpGroupType: asset.jumpGroupType || "shared",
                currentJumpPolicyId: asset.jumpPolicyId ?? null,
            } as JumpAssetUpdateDialogData,
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetUpdateRequest | null) => {
                if (result) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.updateRemoteVnc(
                            this.currentTenantId!,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: "Remote VNC successfully updated.",
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

    public deleteRemoteVNCHandler(asset: RemoteVnc): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select an instance before deleting assets.",
            });
            return;
        }

        this.confirmDialog
            .show({
                title: "Delete Remote VNC",
                message: `Are you sure you want to delete Remote VNC<br><strong>"${asset.name}"</strong>?`,
            })
            .then(async (confirmed) => {
                if (confirmed) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.deleteRemoteVnc(
                            this.currentTenantId!,
                            asset.id,
                        );
                        this.notificationDialog.show({
                            message: `Remote VNC "${asset.name}" successfully deleted.`,
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
            const [items, jumpGroups, jumpPolicies, jumpoints] =
                await Promise.all([
                    this.jumpAssetsService.fetchRemoteVncs(
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

    // private async loadPage(
    //     overrides: Partial<{ pageNumber: number; pageSize: number }> = {}
    // ): Promise<void> {
    //     this.isLoading = true;
    //     try {
    //         const items = await this.jumpAssetsService.fetchRemoteVncs();
    //         this.jumpGroups = await this.jumpGroupsService.fetchJumpGroups();
    //         this.jumpPolicies =
    //             await this.jumpPoliciesService.fetchJumpPolicies();
    //         this.jumpoints = await this.jumpointsService.fetchJumpoints();

    //         this.dataSource.data = items;
    //         this.dataSource.sort = this.sort;
    //         this.dataSource.paginator = this.paginator;
    //         this.dataCount = items.length;

    //         setTimeout(() => this.loadVisibleData(), 10);
    //         // this.paginator.page.subscribe(() =>
    //         //     this.loadVisibleLicenseUsages()
    //         // );
    //     } catch (err: any) {
    //         this.errorDialog.show({
    //             title: "Error",
    //             message: err?.message ?? "Unexpected error",
    //         });
    //     } finally {
    //         this.isLoading = false;
    //     }
    // }

    // private async loadVisibleData(): Promise<void> {
    //     const data = this.dataSource.filteredData || this.dataSource.data;
    //     const pageIndex = this.paginator.pageIndex || 0;
    //     const pageSize = this.paginator.pageSize || 20;
    //     const start = pageIndex * pageSize;
    //     const end = start + pageSize;
    //     const currentPageItems = data; // data.slice(start, end);

    //     for (const item of currentPageItems) {
    //         if (item.jumpGroupId) {
    //             item.jumpGroupName =
    //                 this.jumpGroups.find((g) => g.id === item.jumpGroupId)
    //                     ?.name || "—";
    //         }
    //         if (item.jumpPolicyId) {
    //             item.jumpPolicyName =
    //                 this.jumpPolicies.find((p) => p.id === item.jumpPolicyId)
    //                     ?.displayName || "—";
    //         }
    //         if (item.jumpointId) {
    //             item.jumpointName =
    //                 this.jumpoints.find((j) => j.id === item.jumpointId)
    //                     ?.name || "—";
    //         }
    //     }
    // }

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
