import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { distinctUntilChanged, skip } from "rxjs/operators";
import { JumpGroup } from "./models/jump-group.model";
import { JumpGroupUpdateRequest } from "./models";
import { TenantCache } from "../../shared/helpers/tenant-cache";
import { BtApiDefaults } from "../../shared/config";
import { AppService } from "../../app.service";

@Injectable({ providedIn: "root" })
export class JumpGroupsService {
    private readonly cache = new TenantCache<JumpGroup[]>();

    constructor(
        appService: AppService,
        private readonly http: HttpClient,
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

    public fetchJumpGroups(tenantId: number): Promise<JumpGroup[]> {
        return this.cache.get(tenantId, async () => {
            const params = new HttpParams().set("pageSize", BtApiDefaults.FETCH_ALL_PAGE_SIZE);
            const result = await firstValueFrom(
                this.http.get<JumpGroup[]>("jump-groups", {
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

    public invalidateCache(tenantId: number): void {
        this.cache.invalidate(tenantId);
    }

    public async updateJumpGroup(tenantId: number, id: number, body: JumpGroupUpdateRequest): Promise<JumpGroup> {
        const result = await firstValueFrom(
            this.http.patch<JumpGroup>(`jump-groups/${id}`, body, this.createHeaders(tenantId)),
        );
        this.cache.invalidate(tenantId);
        return result;
    }

    public async deleteJumpGroup(tenantId: number, id: number): Promise<void> {
        await firstValueFrom(this.http.delete<void>(`jump-groups/${id}`, this.createHeaders(tenantId)));
        this.cache.invalidate(tenantId);
    }
}
