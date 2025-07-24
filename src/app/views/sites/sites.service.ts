import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { Site, CreateSiteDtoInput } from "./models";

@Injectable({ providedIn: "root" })
export class SitesService {
    constructor(private http: HttpClient) {}

    public async fetchSites(): Promise<Site[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(this.http.get<Site[]>("sites", { params }));
    }

    public async createSite(body: CreateSiteDtoInput): Promise<Site> {
        return firstValueFrom(this.http.post<Site>("sites", body));
    }

    public async deleteSite(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`sites/${id}`));
    }
}
