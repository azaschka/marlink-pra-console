import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, timeout } from "rxjs/operators";
import { HealthCheckResponse, HealthFetchResult } from "./models";

@Injectable({ providedIn: "root" })
export class HealthService {
    public static readonly TIMEOUT_IN_MS = 10000;

    private readonly baseEndpoint = "health";

    constructor(private readonly http: HttpClient) {}

    /**
     * Polls the health of the PRA API and its dependencies. A 503 with a health body is a valid answer (the
     * service reports itself unavailable); no answer, a timeout or a gateway error is "unreachable".
     */
    public fetchHealth(): Observable<HealthFetchResult> {
        return this.http.get<HealthCheckResponse>(this.baseEndpoint).pipe(
            timeout(HealthService.TIMEOUT_IN_MS),
            map((body): HealthFetchResult => HealthService.toResult(body)),
            catchError((error: unknown) =>
                of(HealthService.toResult(error instanceof HttpErrorResponse ? error.error : undefined)),
            ),
        );
    }

    private static toResult(body: unknown): HealthFetchResult {
        const health = HealthService.unwrapHealthBody(body);

        return health ? { kind: "response", body: health } : { kind: "unreachable" };
    }

    /**
     * An older PRA API answers 503 through its exception filter, which wraps the health result into "message".
     * Returns the health result in either form, or undefined when the body is not a health answer.
     */
    private static unwrapHealthBody(body: unknown): HealthCheckResponse | undefined {
        const isHealth = (value: unknown): value is HealthCheckResponse =>
            typeof value === "object" &&
            value !== null &&
            ("checks" in value || "details" in value || "overallStatus" in value);

        if (isHealth(body)) {
            return body;
        }

        const message = (body as { message?: unknown } | null | undefined)?.message;

        return isHealth(message) ? message : undefined;
    }
}
