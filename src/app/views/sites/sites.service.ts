import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Site, CreateSiteDtoInput, RetrieveSitesParams, SiteLicenseUsage } from "./models";
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

    public async createSite(body: CreateSiteDtoInput): Promise<HttpResponse<Site>> {
        return firstValueFrom(this.http.post<Site>("sites", body, { observe: "response" }));
    }

    public async deleteSite(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`sites/${id}`));
    }

    public async calculateLicenseUsage(id: number): Promise<SiteLicenseUsage> {
        return firstValueFrom(this.http.post<SiteLicenseUsage>(`license-usages/sites/${id}`, {}));
    }
}
