import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import {
    CreateJumpClientInstallerDtoInput,
    JumpClientInstaller,
} from "./models";

@Injectable()
export class JumpClientInstallersService {
    constructor(private readonly http: HttpClient) {}

    public async fetchJumpClientInstallers(): Promise<JumpClientInstaller[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<JumpClientInstaller[]>("jump-clients/installers", {
                params,
            })
        );
    }

    public async createJumpClientInstaller(
        body: CreateJumpClientInstallerDtoInput
    ): Promise<JumpClientInstaller> {
        return firstValueFrom(
            this.http.post<JumpClientInstaller>("jump-clients/installers", body)
        );
    }

    public async deleteJumpClientInstaller(id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(`jump-clients/installers/${id}`)
        );
    }

    // https://marlinksra-pp.beyondtrustcloud.com/download_client_connector?jc=0f09872dc4d2500e68c09749b8d451ee&p=linux64-x86

    public downloadJumpClientInstallerPlatform(
        installerId: string,
        platform: string
    ): Observable<HttpEvent<Blob>> {
        const url = `jump-clients/installers/${installerId}/platforms/${platform}`;
        return this.http.get(url, {
            observe: "events",
            responseType: "blob",
            reportProgress: true,
        });
    }
}
