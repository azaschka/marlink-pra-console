import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import { Jumpoint } from "./models";

@Injectable()
export class JumpointsService {
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

    public async fetchJumpoints(tenantId: number): Promise<Jumpoint[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<Jumpoint[]>("jumpoints", {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }

    public async deleteJumpoint(tenantId: number, id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(
                `jumpoints/${id}`,
                this.createHeaders(tenantId)
            )
        );
    }

    public downloadJumpointInstaller(
        tenantId: number,
        jumpointId: number
    ): Observable<HttpEvent<Blob>> {
        const url = `jumpoints/${jumpointId}/installer`;
        return this.http.get(url, {
            observe: "events",
            responseType: "blob",
            reportProgress: true,
            ...this.createHeaders(tenantId),
        });
    }
}
