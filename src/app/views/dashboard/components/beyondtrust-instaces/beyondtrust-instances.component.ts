import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { BeyondtrustInstance } from "./models";
import { BeyondtrustInstancesService } from "./beyondtrust-instances.service";
import { ConfirmDialogService } from "app/shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "app/shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "app/shared/dialogs/notification-dialog/notification-dialog.service";
import { AppService } from "app/app.service";
import {
    BeyondtrustInstancesOverlayComponent,
    BeyondtrustInstanceOverlayDialogData,
} from "../overlays/beyondtrust-instances-overlay/beyondtrust-instances-overlay.component";
import { ThreadingUtility } from "app/shared/utilities";
import { JwtAuthService } from "app/shared/services/auth/jwt-auth.service";
import { AuthRole } from "app/shared/enums";
import { BusinessUnitLabels } from "app/views/pra-users/enums";

@Component({
    selector: "app-dashboard-beyondtrust-instances",
    templateUrl: "./beyondtrust-instances.component.html",
    styleUrls: ["./beyondtrust-instances.component.scss"],
})
export class BeyondtrustInstancesComponent implements OnInit, OnDestroy {
    private static readonly DISPLAYED_COLUMNS = [
        "status",
        "name",
        "apiBaseUrl",
        "businessUnit",
        "creationDate",
        "actions",
    ];

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild("tablePaginator")
    set tablePaginator(value: MatPaginator) {
        this.paginator = value;
        this.configurePaginator();
    }

    public dataSource = new MatTableDataSource<BeyondtrustInstance>();
    public displayedColumns = BeyondtrustInstancesComponent.DISPLAYED_COLUMNS;
    public dataCount = 0;
    public isLoading = true;
    public isSuperAdmin = false;
    public readonly businessUnitLabels = BusinessUnitLabels;

    private paginator!: MatPaginator;

    private readonly subscriptionsToClear = new Subscription();

    constructor(
        private readonly dialog: MatDialog,
        private readonly beyondtrustInstancesService: BeyondtrustInstancesService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly jwtAuthService: JwtAuthService,
    ) {}

    public async ngOnInit(): Promise<void> {
        // Belt-and-suspenders role check: uses the same localStorage source as
        // UserRoleGuard to catch any BehaviorSubject timing edge cases.
        this.isSuperAdmin = this.jwtAuthService.getPraUser()?.role === AuthRole.SUPER_ADMIN;

        this.addListeners();

        await ThreadingUtility.delayForLoadingAnimation(this.appService.initialize());
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public openAddBeyondtrustInstanceModalHandler(): void {
        this.dialog
            .open(BeyondtrustInstancesOverlayComponent, {
                data: { mode: "add" } as BeyondtrustInstanceOverlayDialogData,
                disableClose: true,
            })
            .afterClosed()
            .subscribe((created: boolean) => {
                if (created) {
                    this.notificationDialog.show({
                        message: "BeyondTrust instance has been created successfully.",
                        icon: "check_circle",
                    });
                    this.refreshBeyondtrustInstancesHealthStatus();
                }
            });
    }

    public openUpdateBeyondtrustInstanceModalHandler(instance: BeyondtrustInstance): void {
        this.dialog
            .open(BeyondtrustInstancesOverlayComponent, {
                data: {
                    mode: "edit",
                    instance,
                } as BeyondtrustInstanceOverlayDialogData,
                disableClose: true,
            })
            .afterClosed()
            .subscribe((updated: boolean) => {
                if (updated) {
                    this.notificationDialog.show({
                        message: `BeyondTrust instance "${instance.name}" has been updated successfully.`,
                        icon: "check_circle",
                    });
                    this.refreshBeyondtrustInstancesHealthStatus();
                }
            });
    }

    public async deleteBeyondtrustInstanceHandler(instance: BeyondtrustInstance): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Instance",
            message: `Are you sure you want to delete instance "${instance.name}"? This action cannot be undone.`,
        });
        if (!confirmed) return;

        try {
            this.isLoading = true;

            // Call service directly
            await this.beyondtrustInstancesService.delete(instance.id);

            // Refresh instances from API
            await this.appService.refreshInstances();

            this.notificationDialog.show({
                message: `Instance "${instance.name}" has been deleted successfully.`,
                icon: "check_circle",
            });
        } catch (error: any) {
            await this.errorDialog.show({
                title: "Delete Failed",
                message: error?.message || "Failed to delete the instance. Please try again.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    public async refreshBeyondtrustInstancesHealthStatus(): Promise<void> {
        try {
            this.isLoading = true;

            // Use AppService's refreshInstances method
            await this.appService.refreshInstances();
        } catch (error: any) {
            await this.errorDialog.show({
                title: "Error Loading Instances",
                message: error?.message || "Failed to load BeyondTrust instances. Please try again.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                this.isSuperAdmin = user?.role === AuthRole.SUPER_ADMIN;
            }),
        );
        this.subscriptionsToClear.add(
            this.appService.instances$.subscribe((instances) => {
                this.isLoading = true;
                this.dataSource.data = instances;
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
                this.dataCount = instances.length;
                this.isLoading = false;
            }),
        );
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
