import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
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
    CreateProtocolTunnelJumpDtoInput,
    CreateWebJumpDtoInput,
    JumpAssetCopyRequest,
    JumpAssetCreateRequest,
    JumpAssetUpdateRequest,
    ProtocolTunnelJump,
} from "../../models";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpointsService } from "../../../jumpoints/jumpoints.service";
import { JumpGroup } from "../../../jump-groups/models";
import { JumpPolicy } from "../../../jump-policies/models";
import { Jumpoint } from "../../../jumpoints/models";
import { BusinessUnit } from "../../../pra-users/enums";
import {
    JumpAssetCreateDialogData,
    JumpAssetCreateOverlayComponent,
} from "../jump-asset-create-overlay/jump-asset-create-overlay.component";
import { JumpGroupType, TunnelType } from "../../enums";

@Component({
    selector: "app-protocol-tunnel",
    templateUrl: "./protocol-tunnel.component.html",
    styleUrls: ["./protocol-tunnel.component.scss"],
})
export class ProtocolTunnelComponent implements OnInit, OnDestroy {
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

    public dataSource = new MatTableDataSource<ProtocolTunnelJump>();
    public defaultPageSize = ProtocolTunnelComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = ProtocolTunnelComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = ProtocolTunnelComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private jumpGroups: JumpGroup[] = [];
    private jumpPolicies: JumpPolicy[] = [];
    private jumpoints: Jumpoint[] = [];

    private currentBusinessUnit: BusinessUnit | null | undefined;
    private currentTenantId: number | null = null;

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly dialog: MatDialog,
        private readonly jwtAuthService: JwtAuthService,
        private readonly jumpAssetsService: JumpAssetsService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly jumpointsService: JumpointsService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly appService: AppService,
    ) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
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

    public async copyProtocolTunnelHandler(
        asset: ProtocolTunnelJump,
    ): Promise<void> {
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
                assetType: "protocolTunnel",
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
                        await this.jumpAssetsService.copyProtocolTunnelJump(
                            this.currentTenantId!,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: `Protocol Tunnel "${result.name}" successfully copied to Jump Group ID "${result.jumpGroupId}".`,
                        });
                        await this.loadPage();
                    } catch (error) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message: error?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async addProtocolTunnelHandler(): Promise<void> {
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
                assetType: "protocolTunnel",
            } as JumpAssetCreateDialogData,
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetCreateRequest | null) => {
                if (result) {
                    this.isLoading = true;
                    try {
                        const body: CreateProtocolTunnelJumpDtoInput = {
                            name: result.name,
                            jumpointId: result.jumpointId,
                            hostname: result.hostname,
                            jumpGroupId: result.jumpGroupId,
                            jumpGroupType: JumpGroupType.Shared,
                            tunnelType: TunnelType.Tcp,
                            username: "",
                            database: "",
                            url: "",
                            caCertificates: "",
                            tag: result.tag,
                            comments: "",
                            jumpPolicyId: result.jumpPolicyId,
                            sessionPolicyId: null,
                        } as CreateProtocolTunnelJumpDtoInput;
                        await this.jumpAssetsService.createProtocolTunnelJump(
                            this.currentTenantId!,
                            body,
                        );
                        this.notificationDialog.show({
                            message: `Protocol Tunnel "${result.name}" successfully created.`,
                        });
                        await this.loadPage();
                    } catch (error) {
                        this.isLoading = false;
                        this.errorDialog.show({
                            title: "Error",
                            message: error?.message ?? "Unexpected error",
                        });
                    }
                }
            });
    }

    public async editProtocolTunnelHandler(
        asset: ProtocolTunnelJump,
    ): Promise<void> {
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
                assetType: "protocolTunnel",
                assetId: asset.id,
                currentName: asset.name,
                currentTag: asset.tag,
                currentHostname: asset.hostname,
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
                        await this.jumpAssetsService.updateProtocolTunnelJump(
                            this.currentTenantId!,
                            asset.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: "Protocol Tunnel successfully updated.",
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

    public deleteProtocolTunnelHandler(asset: ProtocolTunnelJump): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select an instance before deleting assets.",
            });
            return;
        }

        this.confirmDialog
            .show({
                title: "Delete Protocol Tunnel",
                message: `Are you sure you want to delete Protocol Tunnel<br><strong>"${asset.name}"</strong>?`,
            })
            .then(async (confirmed) => {
                if (confirmed) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.deleteProtocolTunnelJump(
                            this.currentTenantId!,
                            asset.id,
                        );
                        this.notificationDialog.show({
                            message: `Protocol Tunnel "${asset.name}" successfully deleted.`,
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
                    this.jumpAssetsService.fetchProtocolTunnelJumps(
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

            // Store lookup tables (if needed later)
            this.jumpGroups = jumpGroups;
            this.jumpPolicies = jumpPolicies;
            this.jumpoints = jumpoints;

            // Enrich items directly
            const enriched = items.map((item) => ({
                ...item,
                jumpGroupName:
                    jumpGroups.find((g) => g.id === item.jumpGroupId)?.name ??
                    "—",
                jumpPolicyName:
                    jumpPolicies.find((p) => p.id === item.jumpPolicyId)
                        ?.displayName ?? "—",
                jumpointName:
                    jumpoints.find((j) => j.id === item.jumpointId)?.name ??
                    "—",
            }));

            // Apply business unit filter
            const filteredItems = PraDataFilter.filterByBusinessUnit(
                enriched,
                this.currentBusinessUnit,
                [
                    (j) => j.jumpGroupName,
                    (j) => j.jumpPolicyName,
                    (j) => j.jumpointName,
                ],
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
    //         const items =
    //             await this.jumpAssetsService.fetchProtocolTunnelJumps();
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
            this.jwtAuthService.praUser.subscribe((user) => {
                if (!user || user.role === "None") {
                    this.jwtAuthService.checkTokenIsValid();
                }
                this.currentBusinessUnit = user.businessUnit;
            }),
        );

        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((instanceId) => {
                this.currentTenantId = instanceId;
                if (instanceId) {
                    this.loadPage();
                }
            }),
        );
    }
}
