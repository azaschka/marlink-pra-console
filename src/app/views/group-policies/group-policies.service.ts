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

    public async fetchGroupPolicies(): Promise<GroupPolicy[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<GroupPolicy[]>("group-policies", { params })
        );
    }

    public async deleteGroupPolicy(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`group-policies/${id}`));
    }

    // Fetch all members (users) of a group policy
    public async fetchGroupPolicyMembers(
        groupPolicyId: number
    ): Promise<GroupPolicyMember[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<GroupPolicyMember[]>(
                `group-policies/${groupPolicyId}/members`,
                { params }
            )
        );
    }

    // Add a user as a member to a group policy
    public async addMemberToGroupPolicy(
        groupPolicyId: number,
        body: GroupPolicyAddMemberRequest
    ): Promise<void> {
        await firstValueFrom(
            this.http.post<void>(
                `group-policies/${groupPolicyId}/members`,
                body
            )
        );
    }

    // Remove a user from a group policy
    public async removeMemberFromGroupPolicy(
        groupPolicyId: number,
        memberId: number
    ): Promise<void> {
        await firstValueFrom(
            this.http.delete<void>(
                `group-policies/${groupPolicyId}/members/${memberId}`
            )
        );
    }
}
