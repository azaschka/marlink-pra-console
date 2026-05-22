import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { distinctUntilChanged, skip } from "rxjs/operators";
import { AppService } from "../../app.service";
import { TenantCache } from "../../shared/helpers/tenant-cache";
import { PraApiDefaults } from "../../shared/config";
import { JumpPolicy } from "./models";

@Injectable({ providedIn: "root" })
export class JumpPoliciesService {
    private readonly cache = new TenantCache<JumpPolicy[]>();

    constructor(
        private readonly http: HttpClient,
        appService: AppService,
    ) {
        appService.selectedInstanceId$.pipe(distinctUntilChanged(), skip(1)).subscribe(() => this.cache.invalidate());
    }

    private createHeaders(tenantId: number) {
        return {
            headers: {
                "X-Tenant-Id": tenantId.toString(),
            },
        };
    }

    public invalidateCache(tenantId: number): void {
        this.cache.invalidate(tenantId);
    }

    public async fetchJumpPolicies(tenantId: number): Promise<JumpPolicy[]> {
        const params = new HttpParams().set("pageSize", PraApiDefaults.FETCH_ALL_PAGE_SIZE);
        return this.cache.get(tenantId, async () => {
            const result = await firstValueFrom(
                this.http.get<JumpPolicy[]>("jump-policies", {
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
}
