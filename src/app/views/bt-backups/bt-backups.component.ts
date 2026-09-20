import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { BtBackupsService } from "./bt-backups.service";
import { BtBackup } from "./models";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { AppService } from "app/app.service";

@Component({
    selector: "app-bt-backups",
    templateUrl: "./bt-backups.component.html",
    styleUrls: ["./bt-backups.component.scss"],
})
export class BtBackupsComponent extends PraBaseComponent implements OnInit {
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
    public isSwitchingInstance = false;
    public loaderMode: "indeterminate" | "buffer" = "indeterminate";
    public dataCount = 0;

    private currentTenantId: number | null = null;

    constructor(
        jwtAuthService: JwtAuthService,
        private readonly btBackupsService: BtBackupsService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly appService: AppService,
    ) {
        super(jwtAuthService);
    }

    /**
     * The manual backup must not be triggered while data is loading, while a
     * BeyondTrust instance switch is in progress, or without a selected instance.
     */
    public get isManualBackupDisabled(): boolean {
        return this.isLoading || this.isSwitchingInstance || this.currentTenantId === null;
    }

    public async ngOnInit(): Promise<void> {
        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();
        this.addListeners();
        await this.loadPage();
    }

    public async triggerManualBackupHandler(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId || this.isManualBackupDisabled) {
            return;
        }

        try {
            this.isLoading = true;
            await this.btBackupsService.createBackup(tenantId);
            this.notificationDialog.show({
                message: `Backup triggered successfully for "${this.getInstanceName(tenantId)}".`,
            });
            await this.loadPage();
        } catch (err: any) {
            this.errorDialog.show({
                title: "Manual Backup Failed",
                message: err?.message ?? "Could not trigger manual backup.",
            });
        } finally {
            // Do not interfere with a load that belongs to a newer instance selection.
            if (tenantId === this.currentTenantId) {
                this.isLoading = false;
            }
        }
    }

    public async downloadBackupHandler(backup: BtBackup): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            return;
        }

        this.isLoading = true;
        this.loaderMode = "buffer";
        try {
            const blob = await this.btBackupsService.downloadBackup(
                tenantId,
                backup.id,
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
            this.loaderMode = "indeterminate";
            if (tenantId === this.currentTenantId) {
                this.isLoading = false;
            }
        }
    }

    private addListeners(): void {
        // Reload backups whenever the BeyondTrust instance is switched in the topbar.
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe(async (instanceId) => {
                const previousTenantId = this.currentTenantId;
                this.currentTenantId = instanceId;

                // selectedInstanceId$ is a BehaviorSubject and emits immediately on
                // subscribe. Only reload when the instance actually changes.
                if (previousTenantId !== null && previousTenantId !== instanceId) {
                    this.isSwitchingInstance = true;
                    this.dataSource.data = [];
                    this.dataCount = 0;
                    this.paginator?.firstPage();
                    await this.loadPage();
                }
            }),
        );
    }

    private getInstanceName(tenantId: number): string {
        return this.appService.getInstanceById(tenantId)?.name ?? `Instance ${tenantId}`;
    }

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn("No BeyondTrust instance selected, skipping backups load");
            this.dataSource.data = [];
            this.dataCount = 0;
            this.isLoading = false;
            this.isSwitchingInstance = false;
            return;
        }

        this.isLoading = true;
        try {
            const items = await this.btBackupsService.fetchBackups(tenantId);

            // Ignore stale responses if the instance was switched while loading.
            if (tenantId !== this.currentTenantId) {
                return;
            }

            this.dataSource.data = items;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = items.length;
        } catch (err: any) {
            if (tenantId !== this.currentTenantId) {
                return;
            }
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            if (tenantId === this.currentTenantId) {
                this.isLoading = false;
                this.isSwitchingInstance = false;
            }
        }
    }
}
