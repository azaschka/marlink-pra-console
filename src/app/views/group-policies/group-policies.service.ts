import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    GroupPolicy,
    GroupPolicyAddMemberRequest,
    GroupPolicyMember,
} from "./models";

@Injectable()
export class GroupPoliciesService {
    constructor(private readonly http: HttpClient) {}

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
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<GroupPolicy[]>("group-policies", {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }

    public async deleteGroupPolicy(
        tenantId: number,
        id: number
    ): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(
                `group-policies/${id}`,
                this.createHeaders(tenantId)
            )
        );
    }

    // Fetch all members (users) of a group policy
    public async fetchGroupPolicyMembers(
        tenantId: number,
        groupPolicyId: number
    ): Promise<GroupPolicyMember[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<GroupPolicyMember[]>(
                `group-policies/${groupPolicyId}/members`,
                {
                    params,
                    ...this.createHeaders(tenantId),
                }
            )
        );
    }

    // Add a user as a member to a group policy
    public async addMemberToGroupPolicy(
        tenantId: number,
        groupPolicyId: number,
        body: GroupPolicyAddMemberRequest
    ): Promise<void> {
        await firstValueFrom(
            this.http.post<void>(
                `group-policies/${groupPolicyId}/members`,
                body,
                this.createHeaders(tenantId)
            )
        );
    }

    // Remove a user from a group policy
    public async removeMemberFromGroupPolicy(
        tenantId: number,
        groupPolicyId: number,
        memberId: number
    ): Promise<void> {
        await firstValueFrom(
            this.http.delete<void>(
                `group-policies/${groupPolicyId}/members/${memberId}`,
                this.createHeaders(tenantId)
            )
        );
    }
}
