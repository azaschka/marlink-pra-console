import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { UserOverlayComponent, UserOverlayDialogData } from "./components/user-overlay/user-overlay.component";
import { UsersService } from "./users.service";
import { User } from "./models";
import { AppService } from "app/app.service";

import { CustomerCacheService } from "../customers/customer-cache.service";
import { CustomerBusinessUnit } from "../customers/enums";
import { UserRole } from "../pra-users/enums";
import { PraUser } from "app/shared/models";
import { PraDataFilter } from "../../shared/helpers";

@Component({
    selector: "app-users",
    templateUrl: "./users.component.html",
    styleUrls: ["./users.component.scss"],
})
export class UsersComponent extends PraBaseComponent implements OnInit {
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
    public isSuperAdmin = false;

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly usersService: UsersService,

        private readonly customerCacheService: CustomerCacheService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        super(jwtAuthService);
    }

    public async ngOnInit(): Promise<void> {
        // Belt-and-suspenders role check: uses the same localStorage source as
        // UserRoleGuard to catch any BehaviorSubject timing edge cases.
        const currentUser = this.jwtAuthService.getPraUser();
        this.isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

        await this.appService.initialize();
        this.currentTenantId = this.appService.getSelectedInstanceId();
        this.addListeners();
        await this.loadPage();
    }

    // -------------------------------------------------------------------------
    // PraBaseComponent hooks
    // -------------------------------------------------------------------------

    protected override onUserChanged(user: PraUser): void {
        this.isSuperAdmin = user?.role === UserRole.SuperAdmin;
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
    }

    // -------------------------------------------------------------------------
    // Filter helpers
    // -------------------------------------------------------------------------

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    // -------------------------------------------------------------------------
    // Action handlers
    // -------------------------------------------------------------------------

    public addUserHandler(): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.subscriptionsToClear.add(
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
                        void this.loadPage();
                    }
                }),
        );
    }

    public editUserHandler(user: User): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.subscriptionsToClear.add(
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
                        void this.loadPage();
                    }
                }),
        );
    }

    public async deactivateUserHandler(user: User): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Deactivate User",
            message: `Are you sure you want to deactivate user:<br><strong>${user.publicDisplayName}</strong>?`,
        });

        if (!confirmed) {
            return;
        }

        this.isLoading = true;
        try {
            await this.usersService.updateUser(this.currentTenantId, user.id, {
                isLoginAllowed: false,
            });
            this.notificationDialog.show({
                message: `User ${user.publicDisplayName} has been deactivated.`,
            });
            await this.loadPage();
        } catch (err: any) {
            this.errorDialog.show({
                title: "Deactivate User Failed",
                message: err?.message || "The user could not be deactivated. Please try again later.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    public async reactivateUserHandler(user: User): Promise<void> {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Reactivate User",
            message: `Are you sure you want to reactivate user:<br><strong>${user.publicDisplayName}</strong>?`,
        });

        if (!confirmed) {
            return;
        }

        this.isLoading = true;
        try {
            await this.usersService.updateUser(this.currentTenantId, user.id, {
                isLoginAllowed: true,
            });
            this.notificationDialog.show({
                message: `User ${user.publicDisplayName} has been reactivated.`,
            });
            await this.loadPage();
        } catch (err: any) {
            this.errorDialog.show({
                title: "Reactivate User Failed",
                message: err?.message || "The user could not be reactivated. Please try again later.",
            });
        } finally {
            this.isLoading = false;
        }
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
                await this.usersService.deleteUser(this.currentTenantId, user.id);
                this.notificationDialog.show({
                    message: `User ${user.publicDisplayName} has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete User Failed",
                    message: err?.message || "The user could not be deleted. Please try again later.",
                });
            } finally {
                this.isLoading = false;
            }
        }
    }

    // -------------------------------------------------------------------------
    // Data loading
    // -------------------------------------------------------------------------

    /**
     * Loads BT users and applies BU-based filtering for BU Admins.
     *
     * ## SuperAdmin
     * All users are displayed without any filtering.
     *
     * ## BU Admin (has a `currentBusinessUnit`)
     * Uses a batched User→GPs lookup (N+1 pattern) because the inverse
     * GP→Members endpoint only returns *directly* assigned members and misses
     * users who inherit a policy via group/directory assignment.
     *
     * 1. Fetch all users                               → O(1) call
     * 2. Fetch customers for the admin's BU            → O(1) call
     * 3. For each user, fetch their group policies     → O(N) calls
     *    processed in parallel batches of BATCH_SIZE to avoid overwhelming
     *    the API (364 users / 50 per batch ≈ 7 sequential rounds).
     * 4. Per-user decision: visible when **any** assigned GP name passes the
     *    shared `PraDataFilter.isGroupPolicyNameVisibleForBuAdmin` predicate
     *    (special policy, BU operator, BU prefix, or customer name match).
     *    Policies outside these criteria — including global super-user policies
     *    such as `GP_MARLINK_SUPERUSERS` — do not match and are excluded
     *    implicitly, keeping the behaviour consistent with the group-policy
     *    and user-overlay views.
     */
    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn("No BeyondTrust instance selected, skipping user load");
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            const allUsers = await this.usersService.fetchUsers(tenantId);

            let filteredUsers: User[];

            if (this.isSuperAdmin || !this.currentBusinessUnit) {
                // SuperAdmin or no BU assigned: show everything unfiltered.
                filteredUsers = allUsers;
            } else {
                const businessUnit = this.currentBusinessUnit as unknown as CustomerBusinessUnit;

                const customers = await this.customerCacheService.fetchCustomers({
                    businessUnits: [businessUnit],
                });

                const customerNames = customers.map((c) => c.name.toLowerCase());
                const buCode = this.currentBusinessUnit ?? "";

                /**
                 * A user is visible to the current BU Admin when at least one
                 * of their assigned group policies passes the shared BU Admin
                 * visibility predicate (special policy, BU operator, BU prefix,
                 * or customer-name match).
                 *
                 * Global super-user policies (e.g. GP_MARLINK_SUPERUSERS) are
                 * excluded implicitly — they match none of the positive criteria
                 * — keeping the behaviour symmetric with the group-policy and
                 * user-overlay views.
                 */
                const matchesBU = async (user: User): Promise<boolean> => {
                    const policies = await this.usersService.fetchUserGroupPolicies(tenantId, user.id).catch(() => []);
                    const policyNames = policies.map((p) => p.groupPolicy?.name ?? "");

                    return policyNames.some((name) =>
                        PraDataFilter.isGroupPolicyNameVisibleForBuAdmin(name, buCode, customerNames),
                    );
                };

                // Process users in parallel batches to balance throughput
                // against API load.
                const BATCH_SIZE = 50;
                const matchResults: boolean[] = [];

                for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
                    const batch = allUsers.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(batch.map((u) => matchesBU(u)));
                    matchResults.push(...batchResults);
                }

                filteredUsers = allUsers.filter((_, i) => matchResults[i]);
            }

            this.dataSource.data = filteredUsers;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredUsers.length;
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
        // Listen for BeyondTrust instance changes and reload data.
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((instanceId) => {
                const previousTenantId = this.currentTenantId;
                this.currentTenantId = instanceId;

                // Reload data if tenant changed (and not initial load).
                if (previousTenantId !== null && previousTenantId !== instanceId) {
                    this.loadPage();
                }
            }),
        );
    }
}
