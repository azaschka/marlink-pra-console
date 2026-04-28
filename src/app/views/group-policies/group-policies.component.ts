import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { UserRole } from "../pra-users/enums";
import { GroupPoliciesService } from "./group-policies.service";
import { CustomerCacheService } from "../customers/customer-cache.service";
import { CustomerBusinessUnit } from "../customers/enums";
import { GroupPolicy } from "./models";
import { AccessPermissionStatusType } from "./enums";
import {
    GroupPolicyOverlayComponent,
    GroupPolicyOverlayDialogData,
} from "./components/group-policy-overlay/group-policy-overlay.component";
import { AppService } from "app/app.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import { PraUser } from "app/shared/models";

@Component({
    selector: "app-group-policies",
    templateUrl: "./group-policies.component.html",
    styleUrls: ["./group-policies.component.scss"],
})
export class GroupPoliciesComponent extends PraBaseComponent implements OnInit {
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly SPECIAL_GROUP_POLICIES: string[] = [
        "GP_FULL_ACCESS",
        "FULL_ACCESS",
        "GP_LIMITED_ACCESS",
        "LIMITED_ACCESS",
        "GP_MARLINK_OPERATORS",
        "MARLINK_OPERATORS",
    ];
    private static readonly DISPLAYED_COLUMNS = [
        "name",
        "groupMembersCount",
        "lastSyncDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<GroupPolicy>();
    public defaultPageSize = GroupPoliciesComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = GroupPoliciesComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = GroupPoliciesComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;
    public isSuperAdmin = false;

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly groupPoliciesService: GroupPoliciesService,
        private readonly customerCacheService: CustomerCacheService,
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

    public applyFilter(): void {
        this.dataSource.filter = this.filterValue.trim().toLowerCase();
        this.dataSource.paginator?.firstPage();
    }

    public removeFilter(): void {
        this.filterValue = "";
        this.applyFilter();
    }

    public getAccessStatusLightColor(
        status: AccessPermissionStatusType,
    ): "ok" | "error" | "warn" {
        switch (status) {
            case AccessPermissionStatusType.Final:
                return "warn";
            case AccessPermissionStatusType.Defined:
                return "ok";
            case AccessPermissionStatusType.NotDefined:
                return "error";
            default:
                return "error";
        }
    }

    public getAccessStatusTooltip(status: AccessPermissionStatusType): string {
        switch (status) {
            case AccessPermissionStatusType.Final:
                return "Status 'final': Prevents other policies of lower priority from overriding the permission value set by this policy.";
            case AccessPermissionStatusType.Defined:
                return "Status 'defined': Controls access permissions with this policy.";
            case AccessPermissionStatusType.NotDefined:
                return "Status 'not-defined': No access permissions are set by this policy.";
            default:
                return "";
        }
    }

    public editGroupPolicyHandler(groupPolicy: GroupPolicy): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        this.dialog
            .open(GroupPolicyOverlayComponent, {
                data: {
                    groupPolicy,
                    tenantId: this.currentTenantId,
                } as GroupPolicyOverlayDialogData,
                disableClose: true,
                width: "720px",
            })
            .afterClosed()
            .subscribe((updated: boolean) => {
                if (updated) {
                    this.notificationDialog.show({
                        message: `Group Policy "${groupPolicy.name}" updated successfully.`,
                    });
                    this.loadPage();
                }
            });
    }

    public async deleteGroupPolicyHandler(
        groupPolicy: GroupPolicy,
    ): Promise<void> {
        if (!this.currentTenantId) {
            await this.errorDialog.show({
                title: "No Instance Selected",
                message: "Please select a BeyondTrust instance first.",
            });
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Delete Group Policy",
            message: `Are you sure you want to delete:<br><strong>${groupPolicy.name}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.groupPoliciesService.deleteGroupPolicy(
                    this.currentTenantId,
                    groupPolicy.id,
                );
                this.notificationDialog.show({
                    message: `Group Policy "${groupPolicy.name}" has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Group Policy Failed",
                    message:
                        err?.message ||
                        "The group policy could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    protected override onUserChanged(user: PraUser): void {
        this.isSuperAdmin = user.role === UserRole.SuperAdmin;
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
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

    private async loadPage(): Promise<void> {
        const tenantId = this.currentTenantId;
        if (!tenantId) {
            console.warn(
                "No BeyondTrust instance selected, skipping group policies load",
            );
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        try {
            const allPolicies =
                await this.groupPoliciesService.fetchGroupPolicies(tenantId);

            let filteredGroupPolicies: GroupPolicy[];

            if (this.isSuperAdmin || !this.currentBusinessUnit) {
                filteredGroupPolicies = allPolicies;
            } else {
                const businessUnit = this
                    .currentBusinessUnit as unknown as CustomerBusinessUnit;
                const customers =
                    await this.customerCacheService.fetchCustomers({
                        businessUnits: [businessUnit],
                    });
                const customerNames = customers.map((c) =>
                    c.name.toLowerCase(),
                );
                const specialPolicies = new Set(
                    GroupPoliciesComponent.SPECIAL_GROUP_POLICIES,
                );

                filteredGroupPolicies = allPolicies.filter((policy) => {
                    if (specialPolicies.has(policy.name.toUpperCase())) {
                        return true;
                    }
                    if (
                        policy.name.startsWith(`${this.currentBusinessUnit}_`)
                    ) {
                        return true;
                    }
                    const lowerName = policy.name.toLowerCase();
                    return customerNames.some((customerName) =>
                        lowerName.includes(customerName),
                    );
                });
            }

            this.dataSource.data = filteredGroupPolicies;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredGroupPolicies.length;

            setTimeout(() => this.loadVisibleGroupMemberCount(), 10);
            // this.paginator.page.subscribe(() =>
            //     this.loadVisibleLicenseUsages()
            // );
        } catch (err: any) {
            await this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "Unexpected error",
            });
        } finally {
            this.isLoading = false;
        }
    }

    private async loadVisibleGroupMemberCount() {
        const tenantId = this.currentTenantId;
        if (!tenantId) return;

        const data = this.dataSource.filteredData || this.dataSource.data;
        const pageIndex = this.paginator.pageIndex || 0;
        const pageSize = this.paginator.pageSize || 20;
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        const currentPageItems = data; // data.slice(start, end);

        for (const groupPolicy of currentPageItems) {
            this.groupPoliciesService
                .fetchGroupPolicyMembers(tenantId, groupPolicy.id)
                .then((members) => {
                    groupPolicy.groupMembersCount = members.length;
                })
                .catch(() => {
                    groupPolicy.groupMembersCount = 0;
                });
        }
    }
}
