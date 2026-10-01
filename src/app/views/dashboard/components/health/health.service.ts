import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, timeout } from "rxjs/operators";
import { HealthCheckResponse, HealthFetchResult } from "./models";
import { unwrapHealthBody } from "./health-mapping";

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
            map((body): HealthFetchResult => {
                const health = unwrapHealthBody(body);

                return health ? { kind: "response", body: health } : { kind: "unreachable", httpStatus: 200 };
            }),
            catchError((error: unknown) => {
                const health = error instanceof HttpErrorResponse ? unwrapHealthBody(error.error) : undefined;

                return of<HealthFetchResult>(
                    health
                        ? { kind: "response", body: health }
                        : { kind: "unreachable", httpStatus: error instanceof HttpErrorResponse ? error.status : 0 },
                );
            }),
        );
    }
}
