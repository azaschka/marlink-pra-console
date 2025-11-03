import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { Subscription } from "rxjs";
import { ConfirmDialogService } from "../../shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "../../shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "../../shared/dialogs/notification-dialog/notification-dialog.service";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../shared/helpers/pra-data-filter";
import { JumpClientInstallersService } from "./jump-client-installers.service";
import { BusinessUnit, UserRole } from "../pra-users/enums";
import { JumpClientInstaller, JumpClientInstallerKeyInfo } from "./models";
import {
    JumpClientInstallerDownloadDialogData,
    JumpClientInstallerDownloadOverlayComponent,
} from "./components/jump-client-installer-download-overlay/jump-client-installer-download-overlay.component";
import { MatDialog } from "@angular/material/dialog";
import { JumpGroupsService } from "../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../jump-policies/jump-policies.service";

@Component({
    selector: "app-jump-client-installers",
    templateUrl: "./jump-client-installers.component.html",
    styleUrls: ["./jump-client-installers.component.scss"],
})
export class JumpClientInstallersComponent implements OnInit, OnDestroy {
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

    private currentBusinessUnit: BusinessUnit | null | undefined;

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly dialog: MatDialog,
        private readonly jwtAuthService: JwtAuthService,
        private readonly jumpClientInstallerService: JumpClientInstallersService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
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

    public isDownloadDisabled(
        jumpClientInstaller: JumpClientInstaller
    ): boolean {
        return !jumpClientInstaller.keyInfo;
    }

    public downloadJumpClientInstallerHandler(
        jumpClientInstaller: JumpClientInstaller
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
        jumpClientInstaller: JumpClientInstaller
    ): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Jump Client Installer",
            message: `Are you sure you want to delete:<br><strong>${jumpClientInstaller.name}</strong>?`,
        });

        if (confirmed) {
            this.isLoading = true;
            try {
                await this.jumpClientInstallerService.deleteJumpClientInstaller(
                    jumpClientInstaller.id
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

    private async loadPage(): Promise<void> {
        this.isLoading = true;
        try {
            const [items, jumpGroups, jumpPolicies] = await Promise.all([
                this.jumpClientInstallerService.fetchJumpClientInstallers(),
                this.jumpGroupsService.fetchJumpGroups(),
                this.jumpPoliciesService.fetchJumpPolicies(),
            ]);
            const enriched = items.map((item) => ({
                ...item,
                jumpGroupName:
                    jumpGroups.find((g) => g.id === item.jumpGroupId)?.name ??
                    "–",
                jumpPolicyName:
                    jumpPolicies.find((p) => p.id === item.jumpPolicyId)
                        ?.displayName ?? "–",
            }));
            console.log("Enriched Jump Client Installers:", enriched);
            const filteredItems = PraDataFilter.filterByBusinessUnit(
                enriched,
                this.currentBusinessUnit,
                [(j) => j.jumpGroupName]
            );
            this.dataSource.data = enriched;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = enriched.length;
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
            })
        );
    }
}
