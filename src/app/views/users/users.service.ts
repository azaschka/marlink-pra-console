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

    public async fetchUsers(tenantId: number): Promise<User[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<User[]>("users", {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }

    public async createUser(
        tenantId: number,
        body: UserCreateRequest
    ): Promise<User> {
        try {
            return await firstValueFrom(
                this.http.post<User>(
                    "users",
                    body,
                    this.createHeaders(tenantId)
                )
            );
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
        tenantId: number,
        id: number,
        body: UserUpdateRequest
    ): Promise<User> {
        return firstValueFrom(
            this.http.patch<User>(
                `users/${id}`,
                body,
                this.createHeaders(tenantId)
            )
        );
    }

    public async deleteUser(tenantId: number, id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(`users/${id}`, this.createHeaders(tenantId))
        );
    }

    public async fetchUserGroupPolicies(
        tenantId: number,
        userId: number
    ): Promise<UserGroupPolicy[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<UserGroupPolicy[]>(`users/${userId}/group-policies`, {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }

    public async updateUserGroupPolicies(
        tenantId: number,
        userId: number,
        toAdd: number[] = [],
        toRemove: number[] = []
    ): Promise<void> {
        const body: UserUpdateGroupPoliciesRequest = {
            groupPolicyIdsToAdd: toAdd,
            groupPolicyIdsToRemove: toRemove,
        };
        await firstValueFrom(
            this.http.patch<void>(
                `users/${userId}/group-policies`,
                body,
                this.createHeaders(tenantId)
            )
        );
    }
}
