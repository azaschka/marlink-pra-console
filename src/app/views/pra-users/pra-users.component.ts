import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { PraUsersService } from "./pra-users.service";
import { PraUser } from "./models";
import { BusinessUnitLabels, UserRole } from "./enums";
import {
    PraUserOverlayComponent,
    PraUserOverlayDialogData,
} from "./components/pra-user-overlay/pra-user-overlay.component";
import { PraDataFilter } from "../../shared/helpers";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { PraUser as AuthPraUser } from "app/shared/models";

@Component({
    selector: "app-pra-users",
    templateUrl: "./pra-users.component.html",
    styleUrls: ["./pra-users.component.scss"],
})
export class PraUsersComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "businessUnit",
        "displayName",
        "email",
        "role",
        "lastModificationDate",
        "creationDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public BusinessUnitLabels = BusinessUnitLabels;

    public dataSource = new MatTableDataSource<PraUser>();
    public defaultPageSize = PraUsersComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = PraUsersComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = PraUsersComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    /**
     * True when the authenticated user is a SuperAdmin.
     * SuperAdmins see ALL pra-users without BU filtering.
     * All other roles (Admin / DataCenterEngineer) are filtered to
     * their own business unit — or see an empty list when no BU is set
     * (fail-secure default).
     */
    private isSuperAdmin = false;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly praUsersService: PraUsersService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        super(jwtAuthService);
    }

    public async ngOnInit(): Promise<void> {
        // Belt-and-suspenders role check: uses the same localStorage source as
        // UserRoleGuard to catch any BehaviorSubject timing edge cases.
        // PraBaseComponent already sets isSuperAdmin synchronously via
        // onUserChanged() in the constructor, but we re-verify here to guard
        // against edge cases where the BehaviorSubject fired before
        // APP_INITIALIZER had a chance to refresh the server profile.
        const currentUser = this.jwtAuthService.getPraUser();
        this.isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;

        await this.loadPage();
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
        // Add to subscriptionsToClear so Angular cleans up if the component
        // is destroyed before the dialog closes.
        this.subscriptionsToClear.add(
            this.dialog
                .open(PraUserOverlayComponent, {
                    data: { mode: "add" } as PraUserOverlayDialogData,
                    disableClose: true,
                    width: "720px",
                })
                .afterClosed()
                .subscribe((created: boolean) => {
                    if (created) {
                        this.notificationDialog.show({
                            message: "User has been created successfully.",
                        });
                        // Service auto-invalidates its cache after createPraUser();
                        // loadPage() will fetch fresh data.
                        void this.loadPage();
                    }
                }),
        );
    }

    public editUserHandler(user: PraUser): void {
        this.subscriptionsToClear.add(
            this.dialog
                .open(PraUserOverlayComponent, {
                    data: { mode: "edit", user } as PraUserOverlayDialogData,
                    disableClose: true,
                    width: "720px",
                })
                .afterClosed()
                .subscribe((updated: boolean) => {
                    if (updated) {
                        this.notificationDialog.show({
                            message: `User "${user.displayName}" updated successfully.`,
                        });
                        void this.loadPage();
                    }
                }),
        );
    }

    public async deleteUserHandler(user: PraUser): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete PRA User",
            message: `Are you sure you want to delete user:<br><strong>${user.displayName}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.praUsersService.deletePraUser(user.id);
                this.notificationDialog.show({
                    message: `User ${user.displayName} has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete PRA User Failed",
                    message: err?.message || "The user could not be deleted. Please try again later.",
                });
            } finally {
                this.isLoading = false;
            }
        }
    }

    protected override onUserChanged(user: AuthPraUser): void {
        this.isSuperAdmin = user?.role === UserRole.SuperAdmin;
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
    }

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        try {
            const praUsers = await this.praUsersService.fetchPraUsers();

            let filteredPraUsers: PraUser[];

            if (this.isSuperAdmin) {
                // SuperAdmins see the full list — no BU restriction.
                filteredPraUsers = praUsers;
            } else if (this.currentBusinessUnit) {
                // BU Admins see only pra-users that belong to their own BU.
                // filterByBusinessUnit checks user.businessUnit against the
                // regex (?:^|_){BU}(?:_|$), so exact-match only (e.g. "MT"
                // does NOT match "MT2" or "SMT").
                filteredPraUsers = PraDataFilter.filterByBusinessUnit(praUsers, this.currentBusinessUnit, [
                    (user) => user.businessUnit,
                ]);
            } else {
                // Non-SuperAdmin with no businessUnit assigned: show nothing.
                // This is a fail-secure default — it should never happen in
                // practice (every Admin is assigned a BU), but prevents an
                // accidental data leak if the user object is malformed.
                filteredPraUsers = [];
            }

            this.dataSource.data = filteredPraUsers;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredPraUsers.length;
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }
}
