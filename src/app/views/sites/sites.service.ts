import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    Site,
    CreateSiteDtoInput,
    RetrieveSitesParams,
    SiteDeletedResult,
    SiteLicenseUsage,
    SiteProcessingResult,
} from "./models";
import { Jumpoint } from "../jumpoints/models";

@Injectable()
export class SitesService {
    constructor(private http: HttpClient) {}

    public async fetchSites(params: RetrieveSitesParams = {}): Promise<Site[]> {
        let httpParams = new HttpParams();

        if (params.pageSize !== undefined) {
            httpParams = httpParams.set("pageSize", params.pageSize.toString());
        }
        if (params.pageNumber !== undefined) {
            httpParams = httpParams.set("pageNumber", params.pageNumber.toString());
        }
        if (params.key !== undefined) {
            httpParams = httpParams.set("key", params.key);
        }
        if (params.name !== undefined) {
            httpParams = httpParams.set("name", params.name);
        }
        if (params.customerKeys !== undefined && params.customerKeys.length > 0) {
            params.customerKeys.forEach((key) => {
                httpParams = httpParams.append("customerKeys", key);
            });
        }

        return firstValueFrom(this.http.get<Site[]>("sites", { params: httpParams }));
    }
    public async fetchSiteByKey(key: string): Promise<Site | undefined> {
        let params = new HttpParams();
        if (key) params = params.set("key", key);
        const sites = await firstValueFrom(this.http.get<Site[]>(`sites`, { params }));
        return sites[0] ?? undefined;
    }

    public async fetchSiteJumpoints(id: number): Promise<Jumpoint[]> {
        return firstValueFrom(this.http.get<Jumpoint[]>(`sites/${id}/jumpoints`));
    }

    public async createSite(body: CreateSiteDtoInput): Promise<HttpResponse<SiteProcessingResult>> {
        return firstValueFrom(this.http.post<SiteProcessingResult>("sites", body, { observe: "response" }));
    }

    public async deleteSite(id: number): Promise<SiteDeletedResult | null> {
        return firstValueFrom(this.http.delete<SiteDeletedResult | null>(`sites/${id}`));
    }

    /**
     * Whether the PRA API of the given BeyondTrust instance supports external (non-local) users (R3.2-A003).
     * Only an API with that support reports `sourceType` on users. Returns undefined when it cannot be decided,
     * for example because the request failed or the instance has no users.
     */
    public async supportsUserSourceType(tenantId: number): Promise<boolean | undefined> {
        try {
            const users = await firstValueFrom(
                this.http.get<{ sourceType?: string }[]>("users", {
                    params: new HttpParams().set("pageSize", "1").set("pageNumber", "1"),
                    headers: { "X-Tenant-Id": tenantId.toString() },
                }),
            );
            if (!users?.length) {
                return undefined;
            }
            return users[0].sourceType !== undefined;
        } catch {
            return undefined;
        }
    }

    public async calculateLicenseUsage(id: number): Promise<SiteLicenseUsage> {
        return firstValueFrom(this.http.post<SiteLicenseUsage>(`license-usages/sites/${id}`, {}));
    }

    public async downloadImportTemplate(): Promise<Blob> {
        return firstValueFrom(
            this.http.get("/assets/templates/PRA%20Ingestion%20Template.xlsx", {
                responseType: "blob",
            }),
        );
    }
}
