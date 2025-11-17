import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { JumpGroup } from "./models/jump-group.model";
import { JumpGroupUpdateRequest } from "./models";

@Injectable()
export class JumpGroupsService {
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

    public async fetchJumpGroups(tenantId: number): Promise<JumpGroup[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<JumpGroup[]>("jump-groups", {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }

    public async updateJumpGroup(
        tenantId: number,
        id: number,
        body: JumpGroupUpdateRequest
    ): Promise<JumpGroup> {
        return firstValueFrom(
            this.http.patch<JumpGroup>(
                `jump-groups/${id}`,
                body,
                this.createHeaders(tenantId)
            )
        );
    }

    public async deleteJumpGroup(tenantId: number, id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(
                `jump-groups/${id}`,
                this.createHeaders(tenantId)
            )
        );
    }
}
