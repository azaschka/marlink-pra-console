import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Subscription } from "rxjs";
import * as jsondiffpatch from "jsondiffpatch";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { BtDiscrepanciesService } from "./bt-discrepancies.service";
import { Discrepancy } from "./models";
import { AppService } from "../../app.service";
import { DiscrepancyEntityType, DiscrepancySyncType } from "./enums";

@Component({
    selector: "app-bt-discrepancies",
    templateUrl: "./bt-discrepancies.component.html",
    styleUrls: ["./bt-discrepancies.component.scss"],
})
export class BtDiscrepanciesComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "id",
        "entityType",
        "diff",
        "creationDate",
        "actions",
    ];

    private static readonly ENTITY_TYPE_LABELS: Record<
        DiscrepancyEntityType,
        string
    > = {
        [DiscrepancyEntityType.GroupPolicy]: "Group Policy",
        [DiscrepancyEntityType.GroupPolicyJumpGroup]: "Group Policy Jump Group",
        [DiscrepancyEntityType.GroupPolicyJumpoint]: "Group Policy Jumpoint",
        [DiscrepancyEntityType.GroupPolicyMember]: "Group Policy Member",
        [DiscrepancyEntityType.GroupPolicyTeam]: "Group Policy Team",
        [DiscrepancyEntityType.JumpClient]: "Jump Client",
        [DiscrepancyEntityType.JumpClientInstaller]: "Jump Client Installer",
        [DiscrepancyEntityType.JumpGroup]: "Jump Group",
        [DiscrepancyEntityType.JumpItemProtocolTunnelJump]:
            "Jump Item (Protocol Tunnel)",
        [DiscrepancyEntityType.JumpItemRemoteRdp]: "Jump Item (Remote RDP)",
        [DiscrepancyEntityType.JumpItemRemoteVnc]: "Jump Item (Remote VNC)",
        [DiscrepancyEntityType.JumpItemShellJump]: "Jump Item (Shell Jump)",
        [DiscrepancyEntityType.JumpItemWebJump]: "Jump Item (Web Jump)",
        [DiscrepancyEntityType.JumpPolicy]: "Jump Policy",
        [DiscrepancyEntityType.Jumpoint]: "Jumpoint",
        [DiscrepancyEntityType.JumpointNode]: "Jumpoint Node",
        [DiscrepancyEntityType.Team]: "Team",
        [DiscrepancyEntityType.TeamUser]: "Team User",
        [DiscrepancyEntityType.User]: "User",
        [DiscrepancyEntityType.UserGroupPolicy]: "User Group Policy",
    };

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public readonly DiscrepancySyncType = DiscrepancySyncType;

    public dataSource = new MatTableDataSource<Discrepancy>();
    public defaultPageSize = BtDiscrepanciesComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = BtDiscrepanciesComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = BtDiscrepanciesComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private currentTenantId: number | null = null;
    private formatHtml: any;
    private htmlFormatterModule: any;

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly btDiscrepanciesService: BtDiscrepanciesService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly sanitizer: DomSanitizer
    ) {
        this.subscriptionsToClear = new Subscription();
        jsondiffpatch.create({
            objectHash: (obj: any) => obj?.id || JSON.stringify(obj),
            arrays: { detectMove: true },
        });
    }

    public async ngOnInit(): Promise<void> {
        this.jwtAuthService.getPraUser();
        this.addListeners();

        await this.loadHtmlFormatter();
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

    public async scanAllHandler(): Promise<void> {
        if (!this.currentTenantId) return;

        const confirmed = await this.confirmDialog.show({
            title: "Scan for Discrepancies",
            message:
                "This will scan all entity types for discrepancies between the PRA database and BeyondTrust. This may take a few moments.<br><br>Do you want to continue?",
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.btDiscrepanciesService.scanAllDiscrepancies(
                    this.currentTenantId
                );
                this.notificationDialog.show({
                    message: "Discrepancy scan completed successfully.",
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Scan Failed",
                    message:
                        err?.message ??
                        "The discrepancy scan failed. Please try again later.",
                });
            } finally {
                this.isLoading = false;
            }
        }
    }

    public getDiffHtml(discrepancy: Discrepancy): SafeHtml {
        const left = discrepancy.internalData || {};
        const right = discrepancy.externalData || {};

        if (Object.keys(left).length === 0 && Object.keys(right).length === 0) {
            return this.sanitizer.bypassSecurityTrustHtml(
                '<div class="no-data">No data available</div>'
            );
        }

        try {
            const delta = jsondiffpatch.diff(left, right);
            if (!delta) {
                return this.sanitizer.bypassSecurityTrustHtml(
                    '<div class="no-diff">No differences found</div>'
                );
            }

            if (!this.formatHtml) {
                return this.sanitizer.bypassSecurityTrustHtml(
                    '<div class="error">Formatter not loaded yet</div>'
                );
            }

            const html = this.formatHtml(delta, left);
            return this.sanitizer.bypassSecurityTrustHtml(html);
        } catch (error) {
            console.error("Error generating diff:", error);
            return this.sanitizer.bypassSecurityTrustHtml(
                '<div class="error">Error generating diff</div>'
            );
        }
    }

    public async syncDiscrepancyHandler(
        discrepancy: Discrepancy,
        syncType: DiscrepancySyncType
    ): Promise<void> {
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
                await this.btDiscrepanciesService.syncDiscrepancy(
                    this.currentTenantId,
                    discrepancy.id,
                    { syncType }
                );
                this.notificationDialog.show({
                    message: "Discrepancy synced successfully.",
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Sync Failed",
                    message:
                        err?.message ??
                        "The discrepancy could not be synced. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    private async loadPage(): Promise<void> {
        if (!this.currentTenantId) {
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            const discrepancies =
                await this.btDiscrepanciesService.fetchDiscrepancies(
                    this.currentTenantId,
                    { pageSize: 9999 }
                );

            this.dataSource.data = discrepancies;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = discrepancies.length;
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

        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((instanceId) => {
                this.currentTenantId = instanceId;
                if (instanceId) {
                    this.loadPage();
                }
            })
        );
    }

    private async loadHtmlFormatter(): Promise<void> {
        try {
            this.htmlFormatterModule = await (import(
                "jsondiffpatch/formatters/html" as any
            ) as Promise<any>);
            this.formatHtml = this.htmlFormatterModule.format;

            // Hide unchanged values by default - only show differences
            if (this.htmlFormatterModule.hideUnchanged) {
                this.htmlFormatterModule.hideUnchanged();
            }

            // Load CSS styles dynamically from local assets
            if (!document.getElementById("jsondiffpatch-styles")) {
                const link = document.createElement("link");
                link.id = "jsondiffpatch-styles";
                link.rel = "stylesheet";
                link.href = "assets/styles/jsondiffpatch@0.7.3.css";
                document.head.appendChild(link);
            }
        } catch (error) {
            console.error(
                "Failed to load jsondiffpatch HTML formatter:",
                error
            );
        }
    }

    public getEntityTypeLabel(entityType: DiscrepancyEntityType): string {
        return (
            BtDiscrepanciesComponent.ENTITY_TYPE_LABELS[entityType] ||
            entityType
        );
    }
}
