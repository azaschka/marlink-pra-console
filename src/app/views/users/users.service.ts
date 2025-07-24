import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    User,
    UserCreateRequest,
    UserGroupPolicy,
    UserUpdateGroupPoliciesRequest,
    UserUpdateRequest,
} from "./models";

@Injectable()
export class UsersService {
    constructor(private http: HttpClient) {}

    public async fetchUsers(): Promise<User[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(this.http.get<User[]>("users", { params }));
    }

    public async createUser(body: UserCreateRequest): Promise<User> {
        return firstValueFrom(this.http.post<User>("users", body));
    }

    public async updateUser(
        id: number,
        body: UserUpdateRequest
    ): Promise<User> {
        return firstValueFrom(this.http.patch<User>(`users/${id}`, body));
    }

    public async deleteUser(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`users/${id}`));
    }

    public async fetchUserGroupPolicies(
        userId: number
    ): Promise<UserGroupPolicy[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<UserGroupPolicy[]>(`users/${userId}/group-policies`, {
                params,
            })
        );
    }

    public async updateUserGroupPolicies(
        userId: number,
        toAdd: number[] = [],
        toRemove: number[] = []
    ): Promise<void> {
        const body: UserUpdateGroupPoliciesRequest = {
            groupPolicyIdsToAdd: toAdd,
            groupPolicyIdsToRemove: toRemove,
        };
        await firstValueFrom(
            this.http.patch<void>(`users/${userId}/group-policies`, body)
        );
    }
}
