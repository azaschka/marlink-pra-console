import { Component, OnInit, ViewChild } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
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
    ProtocolTunnelJump,
} from "../../models";

@Component({
    selector: "app-protocol-tunnel",
    templateUrl: "./protocol-tunnel.component.html",
    styleUrls: ["./protocol-tunnel.component.scss"],
})
export class ProtocolTunnelComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "hostname",
        "name",
        "jumpointId",
        "jumpGroupId",
        "comments",
        "lastSyncDate",
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

    constructor(
        private readonly dialog: MatDialog,
        private readonly jumpAssetsService: JumpAssetsService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
    ) {}

    public async ngOnInit(): Promise<void> {
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

    public async copyProtocolTunnelHandler(
        asset: ProtocolTunnelJump
    ): Promise<void> {
        const dialogRef = this.dialog.open(JumpAssetCopyOverlayComponent, {
            data: {
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
                            asset.id,
                            result
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

    public async editProtocolTunnelHandler(
        asset: ProtocolTunnelJump
    ): Promise<void> {
        const dialogRef = this.dialog.open(JumpAssetUpdateOverlayComponent, {
            data: {
                assetType: "protocolTunnel",
                assetId: asset.id,
                currentName: asset.name,
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
                            asset.id,
                            result
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
                            asset.id
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
        overrides: Partial<{ pageNumber: number; pageSize: number }> = {}
    ): Promise<void> {
        this.isLoading = true;
        try {
            const items =
                await this.jumpAssetsService.fetchProtocolTunnelJumps();

            this.dataSource.data = items;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = items.length;
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }
}
