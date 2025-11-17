import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { Subscription } from "rxjs";
import { BeyondtrustInstance } from "./models";
import { BeyondtrustInstancesService } from "./beyondtrust-instances.service";
import { ConfirmDialogService } from "app/shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "app/shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "app/shared/dialogs/notification-dialog/notification-dialog.service";
import { AppService } from "app/app.service";

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
        // "billingType",
        // "creationDate",
        "actions",
    ];

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<BeyondtrustInstance>();
    public displayedColumns = BeyondtrustInstancesComponent.DISPLAYED_COLUMNS;
    public dataCount = 0;

    public isLoading = false;

    private readonly subscriptionsToClear = new Subscription();

    constructor(
        private readonly beyondtrustInstancesService: BeyondtrustInstancesService,
        private readonly appService: AppService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
    ) {}

    public ngOnInit(): void {
        // Subscribe to instances from AppService state (already loaded at app start)
        this.subscriptionsToClear.add(
            this.appService.instances$.subscribe((instances) => {
                this.dataSource.data = instances;
                this.dataSource.sort = this.sort;
                this.dataSource.paginator = this.paginator;
                this.dataCount = instances.length;
            })
        );
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public openAddBeyondtrustInstanceModalHandler(): void {
        //
    }

    public refreshBeyondtrustInstancesHealthStatus(): void {
        //
    }

    public openUpdateBeyondtrustInstanceModalHandler(
        instance: BeyondtrustInstance
    ): void {
        //
    }

    public async deleteBeyondtrustInstanceHandler(
        instance: BeyondtrustInstance
    ): Promise<void> {
        const confirmed = await this.confirmDialog.show({
            title: "Delete Instance",
            message: `Are you sure you want to delete instance "${instance.name}"? This action cannot be undone.`,
        });
        if (!confirmed) return;

        try {
            this.isLoading = true;

            // Call service directly
            await this.beyondtrustInstancesService.delete(instance.id);

            // Reload instances and update AppService state
            const instances = await this.beyondtrustInstancesService.fetchAll();
            this.appService.setInstances(instances);

            this.notificationDialog.show({
                message: `Instance "${instance.name}" has been deleted successfully.`,
                icon: "check_circle",
            });
        } catch (error: any) {
            await this.errorDialog.show({
                title: "Delete Failed",
                message:
                    error?.message ||
                    "Failed to delete the instance. Please try again.",
            });
        } finally {
            this.isLoading = false;
        }
    }

    public async refreshInstances(): Promise<void> {
        try {
            this.isLoading = true;

            // Call service directly and update AppService state
            const instances = await this.beyondtrustInstancesService.fetchAll();
            this.appService.setInstances(instances);
        } catch (error: any) {
            await this.errorDialog.show({
                title: "Error Loading Instances",
                message:
                    error?.message ||
                    "Failed to load BeyondTrust instances. Please try again.",
            });
        } finally {
            this.isLoading = false;
        }
    }
}
