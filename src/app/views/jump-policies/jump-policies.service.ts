import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { JumpPolicy } from "./models";

@Injectable()
export class JumpPoliciesService {
    constructor(private readonly http: HttpClient) {}

    private createHeaders(tenantId: number) {
        return {
            headers: {
                "X-Tenant-Id": tenantId.toString(),
            },
        };
    }

    public async fetchJumpPolicies(tenantId: number): Promise<JumpPolicy[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<JumpPolicy[]>("jump-policies", {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }
}
