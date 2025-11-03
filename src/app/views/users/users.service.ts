import { Injectable } from "@angular/core";
import {
    HttpClient,
    HttpErrorResponse,
    HttpParams,
} from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ErrorUtils } from "../../shared/helpers";
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
        try {
            return await firstValueFrom(this.http.post<User>("users", body));
        } catch (error) {
            if (error && error instanceof HttpErrorResponse) {
                const messages = ErrorUtils.extractMessages(error.error);
                let errorMessage = "- Status code: " + error.status;
                errorMessage += "<br>- " + messages.join("<br>- ");

                throw new Error(errorMessage);
            }

            throw new Error("Failed to create user. Please try again later.");
        }
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
