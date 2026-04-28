import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { SessionPolicy, RetrieveSessionPoliciesParams } from "./models";

@Injectable()
export class SessionPoliciesService {
    constructor(private readonly http: HttpClient) {}

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

        return firstValueFrom(
            this.http.get<SessionPolicy[]>("session-policies", {
                params: httpParams,
                ...this.createHeaders(tenantId),
            }),
        );
    }
}
