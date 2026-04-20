import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../shared/helpers/pra-data-filter";
import { JumpointsService } from "./jumpoints.service";
import { BusinessUnit, UserRole } from "../pra-users/enums";
import { Jumpoint } from "./models";
import { JumpointInstallerDownloadOverlayComponent } from "./components/jumpoint-installer-download-overlay/jumpoint-installer-download-overlay.component";
import { AppService } from "app/app.service";

@Component({
    selector: "app-jumpoints",
    templateUrl: "./jumpoints.component.html",
    styleUrls: ["./jumpoints.component.scss"],
})
export class JumpointsComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "isConnected",
        "name",
        "codeName",
        "platformType",
        "lastSyncDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public trackById = (_: number, row: { id: number }) => row.id;

    public dataSource = new MatTableDataSource<Jumpoint>();
    public defaultPageSize = JumpointsComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = JumpointsComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = JumpointsComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private currentBusinessUnit: BusinessUnit | null | undefined;
    private currentTenantId: number | null = null;

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly dialog: MatDialog,
        private readonly jwtAuthService: JwtAuthService,
        private readonly jumpointsService: JumpointsService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
        this.jwtAuthService.getPraUser();
        this.addListeners();
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

    public isDownloadDisabled(jumpoint: Jumpoint): boolean {
        return !jumpoint.keyInfo;
    }

    public async downloadJumpointInstallerHandler(
        jumpoint: Jumpoint,
    ): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.dialog.open(JumpointInstallerDownloadOverlayComponent, {
            data: {
                jumpointId: jumpoint.id,
                jumpointName: jumpoint.name,
                tenantId: this.currentTenantId,
            },
            disableClose: true,
        });
    }

    public async deleteJumpointHandler(jumpoint: Jumpoint): Promise<void> {
        if (!this.currentTenantId) {
            await this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Delete Jumpoint",
            message: `Are you sure you want to delete:<br><strong>${jumpoint.name}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.jumpointsService.deleteJumpoint(
                    this.currentTenantId,
                    jumpoint.id,
                );
                this.notificationDialog.show({
                    message: `Jumpoint "${jumpoint.name}" has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Jumpoint Failed",
                    message:
                        err?.message ||
                        "The jumpoint could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn(
                "No BeyondTrust instance selected, skipping jumpoints load",
            );
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            const items = await this.jumpointsService.fetchJumpoints(tenantId);
            const filteredItems = PraDataFilter.filterByBusinessUnit(
                items,
                this.currentBusinessUnit,
                [(j) => j.codeName],
            );
            this.dataSource.data = filteredItems;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredItems.length;
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

                this.currentBusinessUnit = user.businessUnit;
            }),
        );

        // Listen for BeyondTrust instance changes and reload data
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((instanceId) => {
                const previousTenantId = this.currentTenantId;
                this.currentTenantId = instanceId;

                // Reload data if tenant changed (and not initial load)
                if (
                    previousTenantId !== null &&
                    previousTenantId !== instanceId
                ) {
                    this.loadPage();
                }
            }),
        );
    }
}
