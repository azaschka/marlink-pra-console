import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { distinctUntilChanged, skip } from "rxjs/operators";
import { SessionPolicy, RetrieveSessionPoliciesParams } from "./models";
import { AppService } from "../../app.service";
import { TenantCache } from "../../shared/helpers/tenant-cache";

@Injectable({ providedIn: "root" })
export class SessionPoliciesService {
    private readonly cache = new TenantCache<SessionPolicy[]>();

    constructor(
        appService: AppService,
        private readonly http: HttpClient,
    ) {
        appService.selectedInstanceId$
            .pipe(distinctUntilChanged(), skip(1))
            .subscribe(() => this.cache.invalidate());
    }

    private createHeaders(tenantId: number) {
        return {
            headers: {
                "X-Tenant-Id": tenantId.toString(),
            },
        };
    }

    public async fetchSessionPolicies(
        tenantId: number,
        params: RetrieveSessionPoliciesParams = {},
    ): Promise<SessionPolicy[]> {
        const cacheKey =
            Object.keys(params).length === 0
                ? tenantId
                : `${tenantId}::${JSON.stringify(
                      Object.fromEntries(
                          Object.entries(params).sort(([a], [b]) =>
                              a.localeCompare(b),
                          ),
                      ),
                  )}`;

        return this.cache.get(cacheKey, async () => {
            let httpParams = new HttpParams().set(
                "pageSize",
                (params.pageSize ?? 9999).toString(),
            );

            if (params.pageNumber !== undefined) {
                httpParams = httpParams.set(
                    "pageNumber",
                    params.pageNumber.toString(),
                );
            }
            if (params.displayName !== undefined) {
                httpParams = httpParams.set("displayName", params.displayName);
            }
            if (params.codeName !== undefined) {
                httpParams = httpParams.set("codeName", params.codeName);
            }
            if (
                params.codeNamePatterns !== undefined &&
                params.codeNamePatterns.length > 0
            ) {
                params.codeNamePatterns.forEach((pattern) => {
                    httpParams = httpParams.append("codeNamePatterns", pattern);
                });
            }

            const result = await firstValueFrom(
                this.http.get<SessionPolicy[]>("session-policies", {
                    params: httpParams,
                    ...this.createHeaders(tenantId),
                }),
            );

            // Do not cache an empty result — session policies may not be synced
            // yet. On the next open, a fresh request will be attempted.
            if (result.length === 0) {
                this.cache.invalidate(cacheKey);
            }

            return result;
        });
    }
}
