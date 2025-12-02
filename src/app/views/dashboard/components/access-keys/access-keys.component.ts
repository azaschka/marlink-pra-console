import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Subscription } from "rxjs";
import { ClipboardService } from "ngx-clipboard";
import { ConfirmDialogService } from "app/shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "app/shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "app/shared/dialogs/notification-dialog/notification-dialog.service";
import { AccessKey } from "./models";
import { AccessKeysService } from "./access-keys.service";
import { ThreadingUtility } from "app/shared/utilities";
import {
    AccessKeyOverlayComponent,
    AccessKeyOverlayResult,
} from "../overlays/access-key-overlay/access-key-overlay.component";

@Component({
    selector: "app-dashboard-access-keys",
    templateUrl: "./access-keys.component.html",
    styleUrls: ["./access-keys.component.scss"],
})
export class AccessKeysComponent implements OnInit, OnDestroy {
    private static readonly DISPLAYED_COLUMNS = ["name", "key", "actions"];

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild("tablePaginator")
    set tablePaginator(value: MatPaginator) {
        this.paginator = value;
        this.configurePaginator();
    }

    public dataSource = new MatTableDataSource<AccessKey>();
    public displayedColumns = AccessKeysComponent.DISPLAYED_COLUMNS;
    public dataCount = 0;
    public isLoading = true;
    public revealedKeys = new Set<number>();

    private paginator!: MatPaginator;

    private readonly subscriptionsToClear: Subscription = new Subscription();

    constructor(
        private readonly accessKeysService: AccessKeysService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly dialog: MatDialog,
        private readonly clipboardService: ClipboardService,
        private readonly notificationDialog: NotificationDialogService
    ) {}

    public async ngOnInit(): Promise<void> {
        await ThreadingUtility.delayForLoadingAnimation(this.loadPage());
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public openAddAccessKeyModalHandler(): void {
        const dialogRef = this.dialog.open(AccessKeyOverlayComponent, {
            data: { accessKey: null },
            disableClose: true,
        });

        this.subscriptionsToClear.add(
            dialogRef
                .afterClosed()
                .subscribe(async (result: AccessKeyOverlayResult) => {
                    if (result) {
                        await this.handleDialogResult(result);
                    }
                })
        );
    }

    public openUpdateAccessKeyModalHandler(accessKey: AccessKey): void {
        const dialogRef = this.dialog.open(AccessKeyOverlayComponent, {
            data: { accessKey },
            disableClose: true,
        });

        this.subscriptionsToClear.add(
            dialogRef
                .afterClosed()
                .subscribe(async (result: AccessKeyOverlayResult) => {
                    if (result) {
                        await this.handleDialogResult(result);
                    }
                })
        );
    }

    private async handleDialogResult(
        result: AccessKeyOverlayResult
    ): Promise<void> {
        if (!result) return;

        try {
            this.isLoading = true;

            if (result.type === "create") {
                await this.accessKeysService.create(result.dto);
            } else {
                await this.accessKeysService.update(result.id, result.dto);
            }

            await this.loadPage();
        } catch (error) {
            await this.errorDialog.show({
                title: "Error",
                message: `Failed to ${
                    result.type === "create" ? "create" : "update"
                } access key.`,
            });
        } finally {
            this.isLoading = false;
        }
    }

    public async deleteAccessKeyHandler(accessKey: AccessKey): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Access Key",
            message: `Are you sure you want to delete the access key "${accessKey.name}"?`,
        });

        if (!confirmed) {
            return;
        }

        try {
            this.isLoading = true;
            await this.accessKeysService.delete(accessKey.id);
            await this.loadPage();
        } catch (error) {
            await this.errorDialog.show({
                title: "Error",
                message: "Failed to delete access key.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    public toggleKeyVisibility(accessKey: AccessKey): void {
        if (this.revealedKeys.has(accessKey.id)) {
            this.revealedKeys.delete(accessKey.id);
        } else {
            this.revealedKeys.add(accessKey.id);
        }
    }

    public isKeyRevealed(accessKey: AccessKey): boolean {
        return this.revealedKeys.has(accessKey.id);
    }

    public getDisplayKey(accessKey: AccessKey): string {
        if (this.isKeyRevealed(accessKey)) {
            return accessKey.key;
        }
        return "•".repeat(Math.min(accessKey.key.length, 32));
    }

    public copyToClipboard(key: string): void {
        this.clipboardService.copy(key);
        this.notificationDialog.show({ message: "Copied to clipboard ..." });
    }

    private async loadPage(): Promise<void> {
        try {
            this.isLoading = true;
            const accessKeys = await this.accessKeysService.fetchAll();

            // Filter out "PRA Admin Console"
            const filteredAccessKeys = accessKeys.filter(
                (key) => key.name !== "PRA Admin Console"
            );

            this.dataSource.data = filteredAccessKeys;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredAccessKeys.length;

            // Clear revealed keys when reloading
            this.revealedKeys.clear();
        } catch (error) {
            await this.errorDialog.show({
                title: "Error",
                message: "Failed to load access keys.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private configurePaginator(): void {
        if (!this.paginator) {
            return;
        }

        this.paginator.hidePageSize = true;
        this.paginator._intl.nextPageLabel = "";
        this.paginator._intl.previousPageLabel = "";
        this.dataSource.paginator = this.paginator;
    }
}
