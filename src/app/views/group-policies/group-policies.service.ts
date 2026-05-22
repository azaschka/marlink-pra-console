import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { distinctUntilChanged, skip } from "rxjs/operators";
import { GroupPolicy, GroupPolicyAddMemberRequest, GroupPolicyMember } from "./models";
import { TenantCache } from "../../shared/helpers/tenant-cache";
import { AppService } from "../../app.service";
import { PraApiDefaults } from "../../shared/config";

@Injectable({ providedIn: "root" })
export class GroupPoliciesService {
    private readonly policiesCache = new TenantCache<GroupPolicy[]>();
    private readonly membersCache = new TenantCache<GroupPolicyMember[]>();

    constructor(
        private readonly http: HttpClient,
        appService: AppService,
    ) {
        appService.selectedInstanceId$.pipe(distinctUntilChanged(), skip(1)).subscribe(() => {
            this.policiesCache.invalidate();
            this.membersCache.invalidate();
        });
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

    public async fetchGroupPolicies(tenantId: number): Promise<GroupPolicy[]> {
        return this.policiesCache.get(tenantId, async () => {
            const params = new HttpParams().set("pageSize", PraApiDefaults.FETCH_ALL_PAGE_SIZE);
            const result = await firstValueFrom(
                this.http.get<GroupPolicy[]>("group-policies", {
                    params,
                    ...this.createHeaders(tenantId),
                }),
            );
            if (result.length === 0) {
                this.policiesCache.invalidate(tenantId);
            }
            return result;
        });
    }

    public async deleteGroupPolicy(tenantId: number, id: number): Promise<void> {
        await firstValueFrom(this.http.delete<void>(`group-policies/${id}`, this.createHeaders(tenantId)));
        this.policiesCache.invalidate(tenantId);
    }

    // Fetch all members (users) of a group policy
    public async fetchGroupPolicyMembers(tenantId: number, groupPolicyId: number): Promise<GroupPolicyMember[]> {
        const cacheKey = `${tenantId}_${groupPolicyId}`;
        return this.membersCache.get(cacheKey, async () => {
            const params = new HttpParams().set("pageSize", PraApiDefaults.FETCH_ALL_PAGE_SIZE);
            const result = await firstValueFrom(
                this.http.get<GroupPolicyMember[]>(`group-policies/${groupPolicyId}/members`, {
                    params,
                    ...this.createHeaders(tenantId),
                }),
            );
            if (result.length === 0) {
                this.membersCache.invalidate(cacheKey);
            }
            return result;
        });
    }

    // Add a user as a member to a group policy
    public async addMemberToGroupPolicy(
        tenantId: number,
        groupPolicyId: number,
        body: GroupPolicyAddMemberRequest,
    ): Promise<void> {
        await firstValueFrom(
            this.http.post<void>(`group-policies/${groupPolicyId}/members`, body, this.createHeaders(tenantId)),
        );
        this.membersCache.invalidate(`${tenantId}_${groupPolicyId}`);
    }

    // Remove a user from a group policy
    public async removeMemberFromGroupPolicy(tenantId: number, groupPolicyId: number, memberId: number): Promise<void> {
        await firstValueFrom(
            this.http.delete<void>(`group-policies/${groupPolicyId}/members/${memberId}`, this.createHeaders(tenantId)),
        );
        this.membersCache.invalidate(`${tenantId}_${groupPolicyId}`);
    }
}
