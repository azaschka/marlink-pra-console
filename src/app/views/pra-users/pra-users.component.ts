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

    private isAdmin = false;

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
                    this.loadPage();
                }
            });
    }

    public editUserHandler(user: PraUser): void {
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
                    this.loadPage();
                }
            });
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
                    message:
                        err?.message ||
                        "The user could not be deleted. Please try again later.",
                });
            } finally {
                this.isLoading = false;
            }
        }
    }

    protected override onUserChanged(user: AuthPraUser): void {
        this.isAdmin = user.role === UserRole.Admin;
    }

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        try {
            const praUsers = await this.praUsersService.fetchPraUsers();
            let filteredPraUsers = praUsers;
            if (this.isAdmin) {
                filteredPraUsers = PraDataFilter.filterByBusinessUnit(
                    praUsers,
                    this.currentBusinessUnit,
                    [(user) => user.businessUnit],
                );
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
