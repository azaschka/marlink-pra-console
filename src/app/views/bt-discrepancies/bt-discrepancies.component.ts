import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { TranslateService } from "@ngx-translate/core";
import { interval, Subscription } from "rxjs";
import { switchMap, takeWhile, finalize } from "rxjs/operators";
import * as jsondiffpatch from "jsondiffpatch";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { BtDiscrepanciesService } from "./bt-discrepancies.service";
import { Discrepancy } from "./models";
import { PraApiDefaults } from "../../shared/config";
import { AppService } from "../../app.service";
import { DiscrepancyEntityType, DiscrepancyScanStatus, DiscrepancySyncType } from "./enums";
import { getEntityTypeLabel } from "./entity-type-labels";
import { describeScanResult } from "./scan-result";

@Component({
    selector: "app-bt-discrepancies",
    templateUrl: "./bt-discrepancies.component.html",
    styleUrls: ["./bt-discrepancies.component.scss"],
})
export class BtDiscrepanciesComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = ["id", "entityType", "diff", "creationDate", "actions"];
    private static readonly POLL_INTERVAL_MS = 5000;
    private static readonly MAX_POLL_DURATION_MS = 20 * 60 * 1000;

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public readonly DiscrepancySyncType = DiscrepancySyncType;

    public dataSource = new MatTableDataSource<Discrepancy>();
    public defaultPageSize = BtDiscrepanciesComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = BtDiscrepanciesComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = BtDiscrepanciesComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public isScanning = false;
    public isSyncingAllExternal = false;
    public scanError: string | null = null;
    public scanWarning: string | null = null;
    public syncAllExternalError: string | null = null;
    public filterValue = "";
    public dataCount = 0;
    public expandedRowId: number | null = null;

    private currentTenantId: number | null = null;
    private formatHtml: any;
    private htmlFormatterModule: any;
    private pollSubscription: Subscription | null = null;

    constructor(
        jwtAuthService: JwtAuthService,
        private readonly btDiscrepanciesService: BtDiscrepanciesService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly sanitizer: DomSanitizer,
        private readonly translateService: TranslateService,
    ) {
        super(jwtAuthService);
        jsondiffpatch.create({
            objectHash: (obj: any) => obj?.id || JSON.stringify(obj),
            arrays: { detectMove: true },
        });
    }

    public async ngOnInit(): Promise<void> {
        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();
        this.addListeners();

        await this.loadHtmlFormatter();
        await this.loadPage();
    }

    public override ngOnDestroy(): void {
        this.pollSubscription?.unsubscribe();
        super.ngOnDestroy();
    }

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    public async syncAllExternalHandler(): Promise<void> {
        if (!this.currentTenantId) return;

        const confirmed = await this.confirmDialog.show({
            title: "Sync All from BeyondTrust",
            message:
                "This will apply BeyondTrust data to all current discrepancies (<strong>ExternalToInternal</strong>). This action <strong>cannot be undone.</strong><br><br>Do you want to continue?",
        });

        if (confirmed) {
            this.isSyncingAllExternal = true;
            this.syncAllExternalError = null;
            this.isLoading = true;
            try {
                const result = await this.btDiscrepanciesService.syncAllExternalDiscrepancies(this.currentTenantId);
                const msg =
                    result.failed > 0
                        ? `Sync completed: ${result.synced}/${result.total} discrepancies synced. ${result.failed} failed.`
                        : `All ${result.total} discrepancies synced successfully.`;
                this.notificationDialog.show({ message: msg });
                await this.loadPage();
            } catch (err: any) {
                this.syncAllExternalError = "Failed to sync discrepancies. Please try again.";
                this.isLoading = false;
            } finally {
                this.isSyncingAllExternal = false;
            }
        }
    }

    public async scanAllHandler(): Promise<void> {
        if (!this.currentTenantId) return;

        const confirmed = await this.confirmDialog.show({
            title: "Scan for Discrepancies",
            message:
                "This will scan all entity types for discrepancies between the PRA database and BeyondTrust. This may take a few moments.<br><br>Do you want to continue?",
        });

        if (confirmed) {
            this.isScanning = true;
            this.isLoading = true;
            this.scanError = null;
            this.scanWarning = null;
            try {
                const { scanId } = await this.btDiscrepanciesService.scanAllDiscrepancies(this.currentTenantId);
                this.pollUntilComplete(scanId);
            } catch (err: any) {
                this.isScanning = false;
                this.isLoading = false;
                this.scanError = "Failed to start scan. Please try again.";
            }
        }
    }

    private pollUntilComplete(scanId: string): void {
        if (!this.currentTenantId) return;
        const tenantId = this.currentTenantId;
        const startTime = Date.now();

        this.pollSubscription?.unsubscribe();
        this.pollSubscription = interval(BtDiscrepanciesComponent.POLL_INTERVAL_MS)
            .pipe(
                switchMap(() => this.btDiscrepanciesService.getScanStatus(tenantId, scanId)),
                takeWhile((status) => status.status === DiscrepancyScanStatus.Running, true),
                finalize(() => {
                    this.isScanning = false;
                    this.isLoading = false;
                }),
            )
            .subscribe({
                next: (status) => {
                    if (
                        status.status === DiscrepancyScanStatus.Running &&
                        Date.now() - startTime > BtDiscrepanciesComponent.MAX_POLL_DURATION_MS
                    ) {
                        // Stop polling (before, it went on and later reported success). The scan itself goes on
                        // in the PRA API; its result shows once the page is reloaded.
                        this.pollSubscription?.unsubscribe();
                        this.scanError = this.translateService.instant(
                            "views.bt-discrepancies.scan.stillRunning",
                        ) as string;
                        return;
                    }
                    if (status.status !== DiscrepancyScanStatus.Running) {
                        const result = describeScanResult(
                            status,
                            (key, params) => this.translateService.instant(key, params) as string,
                        );
                        if (result.notification) {
                            this.notificationDialog.show({ message: result.notification });
                        }
                        this.scanWarning = result.warning;
                        this.scanError = result.error;
                        if (status.status === DiscrepancyScanStatus.Completed) {
                            this.loadPage();
                        }
                    }
                },
                error: (err: any) => {
                    this.isScanning = false;
                    this.isLoading = false;
                    const status = err?.status;
                    if (status === 0) {
                        this.scanError =
                            "Network error: The server could not be reached. Please check your connection.";
                    } else if (status === 401 || status === 403) {
                        this.scanError =
                            "Authentication error: You are not authorized to view scan results. Please log in again.";
                    } else if (status === 404) {
                        this.scanError =
                            "Scan status unavailable. The server may have restarted while the scan was running.";
                    } else if (status === 500) {
                        this.scanError =
                            "Internal server error: The server encountered an unexpected error while reporting scan status.";
                    } else if (status === 502 || status === 503) {
                        this.scanError =
                            "Service unavailable: The server is temporarily unreachable. Please try again later.";
                    } else if (status === 504) {
                        this.scanError = "Gateway timeout: The server took too long to respond.";
                    } else {
                        this.scanError = `Unexpected error during scan polling${status ? ` (HTTP ${status})` : ""}.`;
                    }
                },
            });
    }

    public getDiffHtml(discrepancy: Discrepancy): SafeHtml {
        const left = discrepancy.internalData || {};
        const right = discrepancy.externalData || {};

        if (Object.keys(left).length === 0 && Object.keys(right).length === 0) {
            return this.sanitizer.bypassSecurityTrustHtml('<div class="no-data">No data available</div>');
        }

        try {
            const delta = jsondiffpatch.diff(left, right);
            if (!delta) {
                return this.sanitizer.bypassSecurityTrustHtml('<div class="no-diff">No differences found</div>');
            }

            if (!this.formatHtml) {
                return this.sanitizer.bypassSecurityTrustHtml('<div class="error">Formatter not loaded yet</div>');
            }

            // Only pass 'left' parameter if this row is expanded
            // When left is passed, unchanged values are shown; when omitted, only changes are shown
            const html = this.expandedRowId === discrepancy.id ? this.formatHtml(delta, left) : this.formatHtml(delta);
            return this.sanitizer.bypassSecurityTrustHtml(html);
        } catch (error) {
            console.error("Error generating diff:", error);
            return this.sanitizer.bypassSecurityTrustHtml('<div class="error">Error generating diff</div>');
        }
    }

    public async syncDiscrepancyHandler(discrepancy: Discrepancy, syncType: DiscrepancySyncType): Promise<void> {
        if (!this.currentTenantId) return;

        const direction =
            syncType === DiscrepancySyncType.InternalToExternal
                ? "PRA Database → BeyondTrust"
                : "BeyondTrust → PRA Database";

        const confirmed = await this.confirmDialog.show({
            title: "Sync Discrepancy",
            message: `Are you sure you want to sync this discrepancy?<br><br><strong>Direction:</strong> ${direction}<br><strong>Entity Type:</strong> ${discrepancy.entityType}<br><br>This action <strong>cannot be undone.</strong>`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.btDiscrepanciesService.syncDiscrepancy(this.currentTenantId, discrepancy.id, { syncType });
                this.notificationDialog.show({
                    message: "Discrepancy synced successfully.",
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Sync Failed",
                    message: err?.message ?? "The discrepancy could not be synced. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    private async loadPage(): Promise<void> {
        if (!this.currentTenantId) return;

        this.isLoading = true;
        try {
            const discrepancies = await this.btDiscrepanciesService.fetchDiscrepancies(this.currentTenantId, {
                pageSize: +PraApiDefaults.FETCH_ALL_PAGE_SIZE,
            });

            this.dataSource.data = discrepancies;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = discrepancies.length;

            // Allow diffs to render, then hide the indicator
            setTimeout(() => {
                this.isLoading = false;
            }, 500);
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
            this.isLoading = false;
        }
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe(async (instanceId) => {
                const previousTenantId = this.currentTenantId;
                this.currentTenantId = instanceId;
                // Prevent double-loading on component init: selectedInstanceId$
                // is a BehaviorSubject that emits immediately on subscribe.
                // Only reload when the instance actually changes mid-session.
                if (previousTenantId !== null && previousTenantId !== instanceId) {
                    this.stopFollowingScan();
                    await this.loadPage();
                }
            }),
        );
    }

    /** A scan and its messages belong to the tenant it was started for; another tenant must not show them. */
    private stopFollowingScan(): void {
        this.pollSubscription?.unsubscribe();
        this.pollSubscription = null;
        this.scanError = null;
        this.scanWarning = null;
        this.syncAllExternalError = null;
    }

    private async loadHtmlFormatter(): Promise<void> {
        try {
            this.htmlFormatterModule = await (import("jsondiffpatch/formatters/html" as any) as Promise<any>);
            this.formatHtml = this.htmlFormatterModule.format;

            // Load CSS styles dynamically from local assets
            if (!document.getElementById("jsondiffpatch-styles")) {
                const link = document.createElement("link");
                link.id = "jsondiffpatch-styles";
                link.rel = "stylesheet";
                link.href = "assets/styles/jsondiffpatch@0.7.3.css";
                document.head.appendChild(link);
            }
        } catch (error) {
            console.error("Failed to load jsondiffpatch HTML formatter:", error);
        }
    }

    public getEntityTypeLabel(entityType: DiscrepancyEntityType): string {
        return getEntityTypeLabel(entityType);
    }

    public toggleRowExpansion(row: Discrepancy): void {
        // Toggle expanded state - getDiffHtml will automatically show/hide unchanged values
        this.expandedRowId = this.expandedRowId === row.id ? null : row.id;
    }
}
