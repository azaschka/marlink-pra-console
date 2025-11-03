import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Site, CreateSiteDtoInput } from "./models";
import { Jumpoint } from "../jumpoints/models";

@Injectable()
export class SitesService {
    constructor(private http: HttpClient) {}

    public async fetchSites(): Promise<Site[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(this.http.get<Site[]>("sites", { params }));
    }
    public async fetchSiteByKey(key: string): Promise<Site | undefined> {
        const params = new HttpParams();
        params.set("pageSize", "9999");
        if (key) params.set("key", key);

        const sites = await firstValueFrom(
            this.http.get<Site[]>(`sites`, { params })
        );

        return sites[0] ?? undefined;
    }

    public async fetchSiteJumpoints(id: number): Promise<Jumpoint[]> {
        return firstValueFrom(
            this.http.get<Jumpoint[]>(`sites/${id}/jumpoints`)
        );
    }

    public async createSite(body: CreateSiteDtoInput): Promise<Site> {
        return firstValueFrom(this.http.post<Site>("sites", body));
    }

    public async deleteSite(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`sites/${id}`));
    }
}
