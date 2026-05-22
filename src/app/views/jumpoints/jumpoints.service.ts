import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import { distinctUntilChanged, skip } from "rxjs/operators";
import { AppService } from "../../app.service";
import { TenantCache } from "../../shared/helpers/tenant-cache";
import { PraApiDefaults } from "../../shared/config";
import { JumpointDeploymentNode, Jumpoint } from "./models";
import { JumpointNodeBusinessUnit } from "./enums";

@Injectable({ providedIn: "root" })
export class JumpointsService {
    private readonly cache = new TenantCache<Jumpoint[]>();

    constructor(
        private readonly http: HttpClient,
        appService: AppService,
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

    public fetchJumpoints(tenantId: number): Promise<Jumpoint[]> {
        return this.cache.get(tenantId, async () => {
            const params = new HttpParams().set("pageSize", PraApiDefaults.FETCH_ALL_PAGE_SIZE);
            const result = await firstValueFrom(
                this.http.get<Jumpoint[]>("jumpoints", {
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

    public async deleteJumpoint(tenantId: number, id: number): Promise<void> {
        await firstValueFrom(this.http.delete<void>(`jumpoints/${id}`, this.createHeaders(tenantId)));
        this.cache.invalidate(tenantId);
    }

    public downloadJumpointInstaller(tenantId: number, jumpointId: number): Observable<HttpEvent<Blob>> {
        const url = `jumpoints/${jumpointId}/installer`;
        return this.http.get(url, {
            observe: "events",
            responseType: "blob",
            reportProgress: true,
            ...this.createHeaders(tenantId),
        });
    }

    // -------------------------------------------------------------------------
    // Deployment node methods
    // Auth is handled automatically by ApiKeyInterceptor — no X-Tenant-Id needed.
    // -------------------------------------------------------------------------

    public fetchDeploymentNodes(): Promise<JumpointDeploymentNode[]> {
        const params = new HttpParams().set("pageSize", PraApiDefaults.FETCH_ALL_PAGE_SIZE);
        return firstValueFrom(this.http.get<JumpointDeploymentNode[]>("deployments/jumpoint-nodes", { params }));
    }

    public createDeploymentNode(
        siteKey: string,
        businessUnit: JumpointNodeBusinessUnit,
    ): Promise<JumpointDeploymentNode> {
        return firstValueFrom(
            this.http.post<JumpointDeploymentNode>("deployments/jumpoint-nodes", { siteKey, businessUnit }),
        );
    }

    public createDeploymentNodeService(id: number): Promise<JumpointDeploymentNode> {
        return firstValueFrom(
            this.http.post<JumpointDeploymentNode>(`deployments/jumpoint-nodes/${id}/services`, { serviceType: PraApiDefaults.DEPLOYMENT_SERVICE_TYPE }),
        );
    }

    public approveDeploymentNode(id: number): Promise<JumpointDeploymentNode> {
        return firstValueFrom(this.http.post<JumpointDeploymentNode>(`deployments/jumpoint-nodes/${id}/approve`, {}));
    }

    public downloadDeploymentNodeIso(id: number): Promise<JumpointDeploymentNode> {
        return firstValueFrom(this.http.post<JumpointDeploymentNode>(`deployments/jumpoint-nodes/${id}/iso`, {}));
    }

    public async downloadDeploymentIsoFile(id: number, certname: string): Promise<void> {
        const blob = await firstValueFrom(
            this.http.get(`deployments/jumpoint-nodes/${id}/iso`, { responseType: "blob" }),
        );

        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `${certname}.iso`;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
    }
}
