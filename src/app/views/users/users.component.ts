import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import {
    UserOverlayComponent,
    UserOverlayDialogData,
} from "./components/user-overlay/user-overlay.component";
import { UsersService } from "./users.service";
import { User } from "./models";
import { AppService } from "app/app.service";

@Component({
    selector: "app-users",
    templateUrl: "./users.component.html",
    styleUrls: ["./users.component.scss"],
})
export class UsersComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "status",
        "publicDisplayName",
        "username",
        "email",
        "lastAuthenticationDate",
        "lastSyncDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<User>();
    public defaultPageSize = UsersComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = UsersComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = UsersComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private readonly subscriptionsToClear: Subscription;
    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        private readonly jwtAuthService: JwtAuthService,
        private readonly usersService: UsersService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
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

    public addUserHandler(): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.dialog
            .open(UserOverlayComponent, {
                data: {
                    mode: "add",
                    tenantId: this.currentTenantId,
                } as UserOverlayDialogData,
                disableClose: true,
                width: "720px",
            })
            .afterClosed()
            .subscribe((created: boolean) => {
                if (created) {
                    this.notificationDialog.show({
                        message: "User has been created successfully.",
                    });
                    this.loadPage();
                }
            });
    }

    public editUserHandler(user: User): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.dialog
            .open(UserOverlayComponent, {
                data: {
                    mode: "edit",
                    user,
                    tenantId: this.currentTenantId,
                } as UserOverlayDialogData,
                disableClose: true,
                width: "720px",
            })
            .afterClosed()
            .subscribe((updated: boolean) => {
                if (updated) {
                    this.notificationDialog.show({
                        message: `User "${user.publicDisplayName}" updated successfully.`,
                    });
                    this.loadPage();
                }
            });
    }

    public deactivateUserHandler(user: User): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.confirmDialog
            .show({
                title: "Deactivate User",
                message: `Are you sure you want to deactivate user:<br><strong>${user.publicDisplayName}</strong>?`,
            })
            .then((confirmed) => {
                if (confirmed) {
                    this.isLoading = true;
                    this.usersService
                        .updateUser(this.currentTenantId!, user.id, {
                            isLoginAllowed: false,
                        })
                        .then(() => {
                            this.notificationDialog.show({
                                message: `User ${user.publicDisplayName} has been deactivated.`,
                            });
                            this.dataSource.data = this.dataSource.data.map(
                                (u) =>
                                    u.id === user.id
                                        ? { ...u, isLoginAllowed: false }
                                        : u,
                            );
                            this.loadPage();
                        })
                        .catch((err: any) => {
                            this.errorDialog.show({
                                title: "Deactivate User Failed",
                                message:
                                    err?.message ||
                                    "The user could not be deactivated. Please try again later.",
                            });
                        })
                        .finally(() => {
                            this.isLoading = false;
                        });
                }
            });
    }

    public reactivateUserHandler(user: User): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.confirmDialog
            .show({
                title: "Reactivate User",
                message: `Are you sure you want to reactivate user:<br><strong>${user.publicDisplayName}</strong>?`,
            })
            .then((confirmed) => {
                if (confirmed) {
                    this.isLoading = true;
                    this.usersService
                        .updateUser(this.currentTenantId!, user.id, {
                            isLoginAllowed: true,
                        })
                        .then(() => {
                            this.notificationDialog.show({
                                message: `User ${user.publicDisplayName} has been reactivated.`,
                            });
                            this.dataSource.data = this.dataSource.data.map(
                                (u) =>
                                    u.id === user.id
                                        ? { ...u, isLoginAllowed: true }
                                        : u,
                            );
                            this.loadPage();
                        })
                        .catch((err: any) => {
                            this.errorDialog.show({
                                title: "Reactivate User Failed",
                                message:
                                    err?.message ||
                                    "The user could not be reactivated. Please try again later.",
                            });
                        })
                        .finally(() => {
                            this.isLoading = false;
                        });
                }
            });
    }

    public async deleteUserHandler(user: User): Promise<void> {
        if (!this.currentTenantId) {
            await this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Delete User",
            message: `Are you sure you want to delete user:<br><strong>${user.publicDisplayName}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.usersService.deleteUser(
                    this.currentTenantId,
                    user.id,
                );
                this.notificationDialog.show({
                    message: `User ${user.publicDisplayName} has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete User Failed",
                    message:
                        err?.message ||
                        "The user could not be deleted. Please try again later.",
                });
            } finally {
                this.isLoading = false;
            }
        }
    }

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn(
                "No BeyondTrust instance selected, skipping user load",
            );
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            const items = await this.usersService.fetchUsers(tenantId);
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
