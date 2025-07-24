import {
    Component,
    OnInit,
    ViewChild,
    OnDestroy,
    Inject,
    LOCALE_ID,
} from "@angular/core";
import { formatDate } from "@angular/common";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Subscription } from "rxjs";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { LogsService } from "./logs.service";
import { egretAnimations } from "../../shared/animations/egret-animations";
import { Log, RetrieveLogsParams } from "./models";
import { AuthRole } from "../../shared/enums";

@Component({
    selector: "app-views-logs",
    templateUrl: "./logs.component.html",
    styleUrls: ["./logs.component.scss"],
    animations: egretAnimations,
})
export class LogsComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 25;
    private static readonly PAGE_SIZE_OPTIONS = [25, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "status",
        "serviceName",
        "actionType",
        "actionName",
        "transactionId",
        "creationDate",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<Log>();
    public defaultPageSize = LogsComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = LogsComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = LogsComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public canExport = false;
    public dataCount = 0;

    private subscriptionsToClear = new Subscription();

    constructor(
        @Inject(LOCALE_ID) private locale: string,
        private readonly jwtAuthService: JwtAuthService,
        private readonly logsService: LogsService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
    ) {}

    public async ngOnInit(): Promise<void> {
        this.attachAuthListener();
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

    public async onPage(evt: PageEvent): Promise<void> {
        await this.loadPage({
            pageNumber: evt.pageIndex + 1,
            pageSize: evt.pageSize,
        });
    }

    public async clearLogHandler(): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Clear System Log",
            message: `Are you sure you want to clear the system log?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.logsService.clearLogs();
                this.notificationDialog.show({
                    message: "System log has been cleared successfully.",
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
    }

    public generateCsvExportFileName(): string {
        return `${formatDate(Date.now(), "yyMMdd", this.locale)}_System_Log`;
    }

    public isError(log: Log): boolean {
        return !!log.payload && log.payload.includes('"errorMessage"');
    }

    private async loadPage(overrides: Partial<RetrieveLogsParams> = {}) {
        this.isLoading = true;
        try {
            const params: RetrieveLogsParams = {
                pageSize:
                    this.paginator?.pageSize ?? LogsComponent.DEFAULT_PAGE_SIZE,
                pageNumber: this.paginator?.pageIndex ?? 0 + 1,
                ...overrides,
            };
            const page = await this.logsService.fetchLogs(params);

            this.dataSource.data = page.items;
            this.dataCount = page.total;
            this.dataSource.sort = this.sort;
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private attachAuthListener(): void {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                if (!user) return;
                this.canExport = user.role === AuthRole.SUPER_ADMIN;
                if (user.role === "None")
                    this.jwtAuthService.checkTokenIsValid();
            })
        );
    }
}
