import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import { Jumpoint } from "./models";

@Injectable()
export class JumpointsService {
    constructor(private readonly http: HttpClient) {}

    public async fetchJumpoints(): Promise<Jumpoint[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<Jumpoint[]>("jumpoints", { params })
        );
    }

    public async deleteJumpoint(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`jumpoints/${id}`));
    }

    public downloadJumpointInstaller(
        jumpointId: number
    ): Observable<HttpEvent<Blob>> {
        const url = `jumpoints/${jumpointId}/installer`;
        return this.http.get(url, {
            observe: "events",
            responseType: "blob",
            reportProgress: true,
        });
    }
}
