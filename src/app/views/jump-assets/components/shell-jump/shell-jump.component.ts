import { Component, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
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
    ShellJump,
} from "../../models";

@Component({
    selector: "app-shell-jump",
    templateUrl: "./shell-jump.component.html",
    styleUrls: ["./shell-jump.component.scss"],
})
export class ShellJumpComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "hostname",
        "name",
        "protocolType",
        "jumpointId",
        "jumpGroupId",
        "comments",
        "lastSyncDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<ShellJump>();
    public defaultPageSize = ShellJumpComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = ShellJumpComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = ShellJumpComponent.DISPLAYED_COLUMNS;

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

    public async copyShellJumpHandler(asset: ShellJump): Promise<void> {
        const dialogRef = this.dialog.open(JumpAssetCopyOverlayComponent, {
            data: {
                assetType: "shellJump",
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
                        await this.jumpAssetsService.copyShellJump(
                            asset.id,
                            result
                        );
                        this.notificationDialog.show({
                            message: `Shell Jump "${result.name}" successfully copied to Jump Group ID "${result.jumpGroupId}".`,
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

    public async editShellJumpHandler(asset: ShellJump): Promise<void> {
        const dialogRef = this.dialog.open(JumpAssetUpdateOverlayComponent, {
            data: {
                assetType: "shellJump",
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
                        await this.jumpAssetsService.updateShellJump(
                            asset.id,
                            result
                        );
                        this.notificationDialog.show({
                            message: "Shell Jump successfully updated.",
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

    public deleteShellJumpHandler(asset: ShellJump): void {
        this.confirmDialog
            .show({
                title: "Delete Shell Jump",
                message: `Are you sure you want to delete Shell Jump<br><strong>"${asset.name}"</strong>?`,
            })
            .then(async (confirmed) => {
                if (confirmed) {
                    this.isLoading = true;
                    try {
                        await this.jumpAssetsService.deleteShellJump(asset.id);
                        this.notificationDialog.show({
                            message: `Shell Jump "${asset.name}" successfully deleted.`,
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
            const items = await this.jumpAssetsService.fetchShellJumps();

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
