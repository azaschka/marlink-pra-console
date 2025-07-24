import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { Subscription } from "rxjs";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { BtBackupsService } from "./bt-backups.service";
import { BtBackup } from "./models";

@Component({
    selector: "app-bt-backups",
    templateUrl: "./bt-backups.component.html",
    styleUrls: ["./bt-backups.component.scss"],
})
export class BtBackupsComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "creationDate",
        "backupFilePath",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<BtBackup>();
    public defaultPageSize = BtBackupsComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = BtBackupsComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = BtBackupsComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public loaderMode: "indeterminate" | "buffer" = "indeterminate";
    public dataCount = 0;

    private readonly subscriptionsToClear = new Subscription();

    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly btBackupsService: BtBackupsService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
    ) {}

    public async ngOnInit(): Promise<void> {
        this.jwtAuthService.getPraUser();
        this.addListeners();
        await this.loadPage();
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public async triggerManualBackupHandler(): Promise<void> {
        try {
            this.isLoading = true;
            await this.btBackupsService.createBackup(1); // 1 = hardcoded instanceId
            this.notificationDialog.show({
                message: "Backup triggered successfully.",
            });
            await this.loadPage();
        } catch (err: any) {
            this.errorDialog.show({
                title: "Manual Backup Failed",
                message: err?.message ?? "Could not trigger manual backup.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    public async downloadBackupHandler(backup: BtBackup): Promise<void> {
        this.isLoading = true;
        this.loaderMode = "buffer";
        try {
            const blob = await this.btBackupsService.downloadBackup(
                1,
                backup.id
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download =
                backup.backupFilePath.split("/").pop() || "bt-backup.nsb";
            a.click();
            window.URL.revokeObjectURL(url);

            this.notificationDialog.show({
                message: `Backup "${backup.backupFilePath
                    .split("/")
                    .pop()}" downloaded successfully.`,
            });
        } catch (err: any) {
            this.errorDialog.show({
                title: "Download failed",
                message: err?.message ?? "Could not download backup file.",
            });
        } finally {
            this.isLoading = false;
            this.loaderMode = "indeterminate";
        }
    }

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        try {
            const items = await this.btBackupsService.fetchBackups(1);
            this.dataSource.data = items;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = items.length;
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                if (!user || user.role === "None") {
                    this.jwtAuthService.checkTokenIsValid();
                }
            })
        );
    }
}
