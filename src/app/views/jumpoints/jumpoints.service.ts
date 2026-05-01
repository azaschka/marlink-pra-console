import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import { distinctUntilChanged, skip } from "rxjs/operators";
import { AppService } from "../../app.service";
import { TenantCache } from "../../shared/helpers/tenant-cache";
import { Jumpoint } from "./models";

@Injectable({ providedIn: "root" })
export class JumpointsService {
    private readonly cache = new TenantCache<Jumpoint[]>();

    constructor(
        private readonly http: HttpClient,
        appService: AppService,
    ) {
        appService.selectedInstanceId$.pipe(distinctUntilChanged(), skip(1)).subscribe(() => this.cache.invalidate());
    }

    /**
     * Creates HTTP headers with X-Tenant-Id set to the BeyondTrust instance ID
     */
    private createHeaders(tenantId: number): {
        headers: { "X-Tenant-Id": string };
    } {
        return {
            headers: {
                "X-Tenant-Id": tenantId.toString(),
            },
        };
    }

    public fetchJumpoints(tenantId: number): Promise<Jumpoint[]> {
        return this.cache.get(tenantId, async () => {
            const params = new HttpParams().set("pageSize", "9999");
            const result = await firstValueFrom(
                this.http.get<Jumpoint[]>("jumpoints", {
                    params,
                    ...this.createHeaders(tenantId),
                }),
            );
            if (result.length === 0) {
                this.cache.invalidate(tenantId);
            }
            return result;
        });
    }

    public async deleteJumpoint(tenantId: number, id: number): Promise<void> {
        await firstValueFrom(this.http.delete<void>(`jumpoints/${id}`, this.createHeaders(tenantId)));
        this.cache.invalidate(tenantId);
    }

    public downloadJumpointInstaller(tenantId: number, jumpointId: number): Observable<HttpEvent<Blob>> {
        const url = `jumpoints/${jumpointId}/installer`;
        return this.http.get(url, {
            observe: "events",
            responseType: "blob",
            reportProgress: true,
            ...this.createHeaders(tenantId),
        });
    }
}
