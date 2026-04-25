import { Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { PraDataFilter } from "../../shared/helpers";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { UserRole } from "../pra-users/enums";
import { JumpGroupsService } from "./jump-groups.service";
import { CustomersService } from "../customers/customers.service";
import { JumpGroup } from "./models";
import {
    JumpGroupUpdateDialogData,
    JumpGroupUpdateOverlayComponent,
} from "./components/jump-group-update-overlay/jump-group-update-overlay.component";
import { JumpAssetUpdateRequest } from "../jump-assets/models";
import { AppService } from "app/app.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { PraUser } from "app/shared/models";

@Component({
    selector: "app-jump-groups",
    templateUrl: "./jump-groups.component.html",
    styleUrls: ["./jump-groups.component.scss"],
})
export class JumpGroupsComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "name",
        "comments",
        "lastSyncDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<JumpGroup>();
    public defaultPageSize = JumpGroupsComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = JumpGroupsComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = JumpGroupsComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;
    public canDelete = false;

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly customersService: CustomersService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
    ) {
        super(jwtAuthService);
    }

    public async ngOnInit(): Promise<void> {
        this.addListeners();
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

    public editJumpGroupHandler(jumpGroup: JumpGroup): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const dialogRef = this.dialog.open(JumpGroupUpdateOverlayComponent, {
            data: {
                currentName: jumpGroup.name,
            } as JumpGroupUpdateDialogData,
            disableClose: true,
        });

        dialogRef
            .afterClosed()
            .subscribe(async (result: JumpAssetUpdateRequest | null) => {
                if (result) {
                    this.isLoading = true;
                    try {
                        await this.jumpGroupsService.updateJumpGroup(
                            this.currentTenantId!,
                            jumpGroup.id,
                            result,
                        );
                        this.notificationDialog.show({
                            message: "Jump Group successfully updated.",
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
            });
    }

    public async deleteJumpGroupHandler(jumpGroup: JumpGroup): Promise<void> {
        if (!this.currentTenantId) {
            await this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Delete Jump Group",
            message: `Are you sure you want to delete:<br><strong>${jumpGroup.name}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.jumpGroupsService.deleteJumpGroup(
                    this.currentTenantId,
                    jumpGroup.id,
                );
                this.notificationDialog.show({
                    message: `Jump Group "${jumpGroup.name}" has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Jump Group Failed",
                    message:
                        err?.message ||
                        "The jump group could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    protected override onUserChanged(user: PraUser): void {
        this.canDelete = user.role === UserRole.SuperAdmin;
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
    }

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn(
                "No BeyondTrust instance selected, skipping jump groups load",
            );
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            const [jumpGroups, customers] = await Promise.all([
                this.jumpGroupsService.fetchJumpGroups(tenantId),
                this.customersService.fetchCustomers(),
            ]);
            const customerBUByKey = new Map(
                customers.map((c) => [c.name.toLowerCase(), c.businessUnit]),
            );
            const filteredJumpGroups = PraDataFilter.filterByBusinessUnit(
                jumpGroups,
                this.currentBusinessUnit,
                [
                    (group) => {
                        const parts = group.name.split("_");
                        const customerKey = parts[0].toLowerCase();
                        const customerKey2 = parts[1]?.toLowerCase();

                        return (
                            customerBUByKey.get(customerKey) ||
                            customerBUByKey.get(customerKey2)
                        );
                    },
                ],
            );

            this.dataSource.data = filteredJumpGroups;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredJumpGroups.length;
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
