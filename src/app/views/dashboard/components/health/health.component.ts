import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { MatPaginator } from "@angular/material/paginator";
import { Subscription, interval } from "rxjs";
import { HealthCheckDisplayItem } from "./models";
import { HealthService } from "./health.service";
import { ThreadingUtility } from "app/shared/utilities";

@Component({
    selector: "app-dashboard-health",
    templateUrl: "./health.component.html",
    styleUrls: ["./health.component.scss"],
})
export class HealthComponent implements OnInit, OnDestroy {
    private static readonly DISPLAYED_COLUMNS = ["status", "name"];

    private static readonly SERVICE_NAMES: Record<string, string> = {
        database: "MariaDB Database",
        praSyncApi: "PRA Sync API",
        storage: "Storage Availability",
        memoryHeap: "Memory Heap Usage",
    };

    @ViewChild(MatSort) sort!: MatSort;
    @ViewChild(MatPaginator) paginator!: MatPaginator;

    public dataSource = new MatTableDataSource<HealthCheckDisplayItem>();
    public displayedColumns = HealthComponent.DISPLAYED_COLUMNS;
    public dataCount = 0;

    public isLoading = false;
    public isHealthy = true;

    private readonly subscriptionsToClear = new Subscription();

    constructor(private readonly healthService: HealthService) {}

    public async ngOnInit(): Promise<void> {
        this.addListeners();

        await ThreadingUtility.delayForLoadingAnimation(this.checkHealth());
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public async refreshHealth(): Promise<void> {
        await this.checkHealth();
    }

    private async checkHealth(): Promise<void> {
        try {
            this.isLoading = true;
            const response = await this.healthService.checkHealth();

            // Check if overall status is healthy
            this.isHealthy = response.status === "ok";

            // Transform response to display items
            const items: HealthCheckDisplayItem[] = [];

            // Process each service
            Object.keys(HealthComponent.SERVICE_NAMES).forEach((key) => {
                const serviceStatus = response.details[key]?.status || "down";
                const isDown = serviceStatus === "down" || !this.isHealthy;

                items.push({
                    key,
                    displayName: HealthComponent.SERVICE_NAMES[key],
                    status: serviceStatus,
                    cssClass: isDown ? "offline" : "online",
                });
            });

            this.dataSource.data = items;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = items.length;
        } catch (error: any) {
            // If request fails (not 200), mark all as offline
            this.isHealthy = false;
            const items: HealthCheckDisplayItem[] = Object.keys(
                HealthComponent.SERVICE_NAMES
            ).map((key) => ({
                key,
                displayName: HealthComponent.SERVICE_NAMES[key],
                status: "down",
                cssClass: "offline",
            }));

            this.dataSource.data = items;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.dataCount = items.length;
        } finally {
            this.isLoading = false;
        }
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            interval(30000).subscribe(() => {
                this.checkHealth();
            })
        );
    }
}
