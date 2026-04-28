import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";

import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../shared/helpers/pra-data-filter";
import { JumpClientInstallersService } from "./jump-client-installers.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";
import {
    CreateJumpClientInstallerDtoInput,
    JumpClientInstaller,
    JumpClientInstallerKeyInfo,
} from "./models";
import {
    JumpClientInstallerDownloadDialogData,
    JumpClientInstallerDownloadOverlayComponent,
} from "./components/jump-client-installer-download-overlay/jump-client-installer-download-overlay.component";
import { JumpClientInstallerCreateOverlayComponent } from "./components/jump-client-installer-create-overlay/jump-client-installer-create-overlay.component";
import { JumpGroupsService } from "../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../jump-policies/jump-policies.service";
import { AppService } from "../../app.service";
import { CustomerCacheService } from "../customers/customer-cache.service";
import { CustomerBusinessUnit } from "../customers/enums";

@Component({
    selector: "app-jump-client-installers",
    templateUrl: "./jump-client-installers.component.html",
    styleUrls: ["./jump-client-installers.component.scss"],
})
export class JumpClientInstallersComponent
    extends PraBaseComponent
    implements OnInit
{
    private static readonly DEFAULT_PAGE_SIZE = 20;
    private static readonly PAGE_SIZE_OPTIONS = [20, 50, 100];
    private static readonly DISPLAYED_COLUMNS = [
        "name",
        "jumpGroupName",
        "jumpPolicyName",
        "expirationDate",
        "lastSyncDate",
        "actions",
    ];

    @ViewChild(MatSort, { static: true }) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<JumpClientInstaller>();
    public defaultPageSize = JumpClientInstallersComponent.DEFAULT_PAGE_SIZE;
    public pageSizeOptions = JumpClientInstallersComponent.PAGE_SIZE_OPTIONS;
    public displayedColumns = JumpClientInstallersComponent.DISPLAYED_COLUMNS;

    public isLoading = true;
    public filterValue = "";
    public dataCount = 0;

    private currentTenantId: number | null = null;

    constructor(
        private readonly dialog: MatDialog,
        jwtAuthService: JwtAuthService,
        private readonly jumpClientInstallerService: JumpClientInstallersService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly customerCacheService: CustomerCacheService,
    ) {
        super(jwtAuthService);
    }

    protected override onBusinessUnitChanged(): void {
        void this.loadPage();
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

    public isDownloadDisabled(
        jumpClientInstaller: JumpClientInstaller,
    ): boolean {
        return !jumpClientInstaller.keyInfo;
    }

    public addJumpClientInstallerHandler(): void {
        if (!this.currentTenantId) {
            this.errorDialog.show({
                title: "No BeyondTrust Instance Selected",
                message:
                    "Please select a BeyondTrust instance before adding a Jump Client Installer.",
            });
            return;
        }

        const dialogRef = this.dialog.open(
            JumpClientInstallerCreateOverlayComponent,
            {
                data: { tenantId: this.currentTenantId },
                disableClose: true,
            },
        );

        dialogRef
            .afterClosed()
            .subscribe(
                async (result: CreateJumpClientInstallerDtoInput | null) => {
                    if (result && this.currentTenantId) {
                        this.isLoading = true;
                        try {
                            await this.jumpClientInstallerService.createJumpClientInstaller(
                                this.currentTenantId,
                                result,
                            );
                            this.notificationDialog.show({
                                message: `Jump Client Installer "${result.name ?? "New Installer"}" has been created.`,
                            });
                            await this.loadPage();
                        } catch (err: any) {
                            this.errorDialog.show({
                                title: "Create Jump Client Installer Failed",
                                message:
                                    err?.message ??
                                    "The jump client installer could not be created. Please try again later.",
                            });
                            this.isLoading = false;
                        }
                    }
                },
            );
    }

    public downloadJumpClientInstallerHandler(
        jumpClientInstaller: JumpClientInstaller,
    ): void {
        this.dialog.open(JumpClientInstallerDownloadOverlayComponent, {
            width: "480px",
            data: {
                installerId: jumpClientInstaller.installerId,
                keyInfos:
                    jumpClientInstaller.keyInfo as JumpClientInstallerKeyInfo[],
            } as unknown as JumpClientInstallerDownloadDialogData,
            disableClose: true,
        });
    }

    public async deleteJumpClientInstallerHandler(
        jumpClientInstaller: JumpClientInstaller,
    ): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Jump Client Installer",
            message: `Are you sure you want to delete:<br><strong>${jumpClientInstaller.name}</strong>?`,
        });

        if (confirmed) {
            if (!this.currentTenantId) {
                this.errorDialog.show({
                    title: "Delete Jump Client Installer Failed",
                    message:
                        "No tenant selected. Please select a tenant first.",
                });
                return;
            }

            this.isLoading = true;
            try {
                await this.jumpClientInstallerService.deleteJumpClientInstaller(
                    this.currentTenantId,
                    jumpClientInstaller.id,
                );
                this.notificationDialog.show({
                    message: `Jump Client Installer "${jumpClientInstaller.name}" has been deleted.`,
                });
                await this.loadPage();
            } catch (err: any) {
                this.errorDialog.show({
                    title: "Delete Jump Client Installer Failed",
                    message:
                        err?.message ||
                        "The jump client installer could not be deleted. Please try again later.",
                });
                this.isLoading = false;
            }
        }
    }

    private async loadPage(
        overrides: Partial<{ pageNumber: number; pageSize: number }> = {},
    ): Promise<void> {
        if (!this.currentTenantId) {
            return;
        }

        this.isLoading = true;
        try {
            // Load all necessary data in parallel
            const [items, jumpGroups, jumpPolicies, customers] =
                await Promise.all([
                    this.jumpClientInstallerService.fetchJumpClientInstallers(
                        this.currentTenantId,
                    ),
                    this.jumpGroupsService.fetchJumpGroups(
                        this.currentTenantId,
                    ),
                    this.jumpPoliciesService.fetchJumpPolicies(
                        this.currentTenantId,
                    ),
                    this.currentBusinessUnit
                        ? this.customerCacheService.fetchCustomers({
                              businessUnits: [
                                  this
                                      .currentBusinessUnit as unknown as CustomerBusinessUnit,
                              ],
                          })
                        : Promise.resolve([]),
                ]);

            // Build lookup maps for O(1) enrichment (instead of Array.find per item)
            const jumpGroupMap = new Map(jumpGroups.map((g) => [g.id, g]));
            const jumpPolicyMap = new Map(jumpPolicies.map((p) => [p.id, p]));

            // Enrich items with display names
            const enriched = items.map((item) => ({
                ...item,
                jumpGroupName: jumpGroupMap.get(item.jumpGroupId)?.name ?? "–",
                jumpPolicyName: item.jumpPolicyId
                    ? (jumpPolicyMap.get(item.jumpPolicyId)?.displayName ?? "–")
                    : "–",
            }));

            // BU Admins: filter items to only those in allowed jump groups.
            // Jump group codeName follows {customer_name}_{support_team_name} (lowercase).
            // filterByCustomerPrefix normalises to uppercase for case-insensitive matching.
            // SuperAdmins (currentBusinessUnit is null/undefined): no filtering.
            const allowedJumpGroupIds = this.currentBusinessUnit
                ? new Set(
                      PraDataFilter.filterByCustomerPrefix(
                          jumpGroups,
                          customers.map((c) => c.name),
                          (g) => g.codeName,
                      ).map((g) => g.id),
                  )
                : null;

            const filteredItems = allowedJumpGroupIds
                ? PraDataFilter.filterByAllowedJumpGroupIds(
                      enriched,
                      allowedJumpGroupIds,
                  )
                : enriched;

            // Optional pagination overrides (if the calling location wants it)
            if (overrides.pageNumber !== undefined && this.paginator) {
                this.paginator.pageIndex = overrides.pageNumber;
            }
            if (overrides.pageSize !== undefined && this.paginator) {
                this.paginator.pageSize = overrides.pageSize;
            }

            // Provide MatTableDataSource
            this.dataSource.data = filteredItems;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = filteredItems.length;

            // Ensure paginator is on a valid page
            if (this.paginator) {
                const maxPageIndex = Math.max(
                    Math.ceil(filteredItems.length / this.paginator.pageSize) -
                        1,
                    0,
                );
                if (this.paginator.pageIndex > maxPageIndex) {
                    this.paginator.firstPage();
                }
            }
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
            this.appService.selectedInstanceId$.subscribe(
                async (instanceId) => {
                    const previousTenantId = this.currentTenantId;
                    this.currentTenantId = instanceId;
                    // Prevent double-loading on component init: selectedInstanceId$
                    // is a BehaviorSubject that emits immediately on subscribe.
                    // Only reload when the instance actually changes mid-session.
                    if (
                        previousTenantId !== null &&
                        previousTenantId !== instanceId
                    ) {
                        await this.loadPage();
                    }
                },
            ),
        );
    }
}
