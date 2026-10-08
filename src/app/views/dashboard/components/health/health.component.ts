import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { TranslateService } from "@ngx-translate/core";
import { Subject, Subscription, fromEvent, interval, merge, of } from "rxjs";
import { exhaustMap, filter, finalize } from "rxjs/operators";
import { HealthCheckDisplayItem, HealthFetchResult } from "./models";
import { HealthService } from "./health.service";
import { formatTime, mapHealthRows, markStale, unknownRows } from "./health-mapping";

/**
 * One row per dependency with up (green), warning (amber), down (red) or unknown (grey). When the PRA API does
 * not answer, a banner is shown and the rows keep their last known state, marked as stale. Polls every 30 s
 * without overlapping requests and pauses while the browser tab is hidden.
 */
@Component({
    selector: "app-dashboard-health",
    templateUrl: "./health.component.html",
    styleUrls: ["./health.component.scss"],
})
export class HealthComponent implements OnInit, OnDestroy {
    public static readonly POLL_INTERVAL_IN_MS = 30000;
    private static readonly DISPLAYED_COLUMNS = ["status", "name"];

    public dataSource = new MatTableDataSource<HealthCheckDisplayItem>();
    public displayedColumns = HealthComponent.DISPLAYED_COLUMNS;
    public dataCount = 0;

    public isLoading = false;
    public isHealthy = true;
    public isUnreachable = false;
    public lastUpdated: string | undefined;

    // Rows of the last answer. Stale rows are derived from them, never from the displayed (already stale) rows.
    private lastKnownRows: HealthCheckDisplayItem[] = [];

    private readonly refresh$ = new Subject<void>();
    private readonly subscriptionsToClear = new Subscription();

    constructor(
        private readonly healthService: HealthService,
        private readonly translateService: TranslateService,
    ) {}

    public ngOnInit(): void {
        const becameVisible$ = fromEvent(document, "visibilitychange").pipe(filter(() => !document.hidden));
        const triggers$ = merge(of(undefined), interval(HealthComponent.POLL_INTERVAL_IN_MS), this.refresh$, becameVisible$);

        this.subscriptionsToClear.add(
            triggers$
                .pipe(
                    filter(() => !document.hidden),
                    // A poll that is still running makes further triggers wait for nothing: no overlap.
                    exhaustMap(() => {
                        this.isLoading = true;

                        return this.healthService.fetchHealth().pipe(finalize(() => (this.isLoading = false)));
                    }),
                )
                .subscribe((result) => this.apply(result)),
        );
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public refreshHealth(): void {
        this.refresh$.next();
    }

    private apply(result: HealthFetchResult): void {
        const translate = (key: string, params?: Record<string, unknown>) =>
            this.translateService.instant(key, params) as string;

        if (result.kind === "response") {
            this.isUnreachable = false;
            this.isHealthy = result.body.overallStatus
                ? result.body.overallStatus !== "unavailable"
                : result.body.status === "ok";
            this.lastUpdated = formatTime(new Date());
            this.lastKnownRows = mapHealthRows(result.body, translate);
            this.show(this.lastKnownRows);

            return;
        }

        this.isUnreachable = true;
        this.show(
            this.lastUpdated
                ? markStale(this.lastKnownRows, translate, this.lastUpdated)
                : unknownRows(translate),
        );
    }

    private show(rows: HealthCheckDisplayItem[]): void {
        this.dataSource.data = rows;
        this.dataCount = rows.length;
    }
}
