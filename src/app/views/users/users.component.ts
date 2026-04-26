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
import {
    UserOverlayComponent,
    UserOverlayDialogData,
} from "./components/user-overlay/user-overlay.component";
import { UsersService } from "./users.service";
import { User } from "./models";
import { AppService } from "app/app.service";
import { GroupPoliciesService } from "../group-policies/group-policies.service";
import { CustomersService } from "../customers/customers.service";
import { CustomerBusinessUnit } from "../customers/enums";
import { UserRole } from "../pra-users/enums";
import { PraUser } from "app/shared/models";

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

    /**
     * Group policy names whose *members* must be hidden from BU Admins.
     * A BT user who belongs to any of these policies is a Marlink-global
     * account and should not be visible to — or manageable by — a BU Admin.
     *
     * NOTE: This list is intentionally separate from the SPECIAL_GROUP_POLICIES
     * list in GroupPoliciesComponent, which controls *which policies* are
     * shown to BU Admins.  Here we control *which users* are shown.
     * The list will be extended over time.
     */
    private static readonly SUPERUSER_GROUP_POLICIES = new Set<string>([
        "GP_MARLINK_SUPERUSERS",
        "MARLINK_SUPERUSERS",
    ]);

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
        private readonly groupPoliciesService: GroupPoliciesService,
        private readonly customersService: CustomersService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        super(jwtAuthService);
    }

    public async ngOnInit(): Promise<void> {
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
     * Uses an inverted GP→Members lookup to avoid N+1 HTTP requests:
     *
     * 1. Fetch customers for the admin's BU            → O(1) call
     * 2. Fetch all users                               → O(1) call
     * 3. Fetch all group policies                      → O(1) call
     * 4. Client-side: partition GPs into
     *    - `superuserGPs`  — names in SUPERUSER_GROUP_POLICIES
     *    - `buRelevantGPs` — BU-prefix match OR customer-name match
     * 5. Fetch GP members for both sets in parallel    → O(M_gp) calls
     *    (M_gp = number of GPs in the BU, typically << number of users)
     * 6. Build `includedUserIds` and `excludedUserIds` sets
     * 7. Filter: included AND NOT excluded
     *
     * This trades O(N_users) API calls for O(M_gps) calls.
     */
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
            const allUsers = await this.usersService.fetchUsers(tenantId);

            let filteredUsers: User[];

            if (this.isSuperAdmin || !this.currentBusinessUnit) {
                // SuperAdmin or no BU assigned: show everything unfiltered.
                filteredUsers = allUsers;
            } else {
                const businessUnit = this
                    .currentBusinessUnit as unknown as CustomerBusinessUnit;

                // Steps 1–3: three independent calls in parallel.
                const [customers, allGroupPolicies] = await Promise.all([
                    this.customersService.fetchCustomers({
                        businessUnits: [businessUnit],
                    }),
                    this.groupPoliciesService.fetchGroupPolicies(tenantId),
                ]);

                const customerNames = customers.map((c) =>
                    c.name.toLowerCase(),
                );
                const superuserSet = UsersComponent.SUPERUSER_GROUP_POLICIES;

                // Step 4: partition GPs client-side.
                const superuserGPs = allGroupPolicies.filter((gp) =>
                    superuserSet.has(gp.name.toUpperCase()),
                );

                const buRelevantGPs = allGroupPolicies.filter((gp) => {
                    // Never include superuser policies in the "BU-relevant" set.
                    if (superuserSet.has(gp.name.toUpperCase())) return false;

                    // Match by BU prefix, e.g. "OA_..."
                    if (gp.name.startsWith(`${this.currentBusinessUnit}_`)) {
                        return true;
                    }

                    // Match by customer name substring, e.g. "ADMINISTRATORS_GANI_INC"
                    const lowerName = gp.name.toLowerCase();
                    return customerNames.some((customerName) =>
                        lowerName.includes(customerName),
                    );
                });

                // Step 5: fetch GP members for both sets in parallel.
                // Failures per-GP are caught individually so one broken GP
                // cannot abort the whole page load.
                const fetchMembers = (gpId: number) =>
                    this.groupPoliciesService
                        .fetchGroupPolicyMembers(tenantId, gpId)
                        .catch((err) => {
                            console.warn(
                                `Could not fetch members for GP ${gpId}:`,
                                err,
                            );
                            return [];
                        });

                const [superuserMemberArrays, buMemberArrays] =
                    await Promise.all([
                        Promise.all(
                            superuserGPs.map((gp) => fetchMembers(gp.id)),
                        ),
                        Promise.all(
                            buRelevantGPs.map((gp) => fetchMembers(gp.id)),
                        ),
                    ]);

                // Step 6: build lookup sets.
                const excludedUserIds = new Set<number>(
                    superuserMemberArrays.flat().map((m) => m.userId),
                );
                const includedUserIds = new Set<number>(
                    buMemberArrays.flat().map((m) => m.userId),
                );

                // Step 7: apply filter.
                filteredUsers = allUsers.filter(
                    (u) =>
                        includedUserIds.has(u.id) && !excludedUserIds.has(u.id),
                );
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
