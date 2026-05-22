import { Injectable } from "@angular/core";
import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import {
    CreateJumpClientInstallerDtoInput,
    JumpClientInstaller,
} from "./models";
import { JumpClientConnectionType, JumpClientGroupType } from "./enums";
import { PraApiDefaults } from "../../shared/config";

export interface RetrieveJumpClientInstallersParams {
    pageSize?: number;
    pageNumber?: number;
    name?: string;
    hostname?: string;
    fqdn?: string;
    tag?: string;
    jumpGroupIds?: number[];
    jumpGroupType?: JumpClientGroupType;
    connectionType?: JumpClientConnectionType;
    installerId?: string;
}

@Injectable()
export class JumpClientInstallersService {
    constructor(private readonly http: HttpClient) {}

    private createHeaders(tenantId: number) {
        return { headers: { "X-Tenant-Id": tenantId.toString() } };
    }

    public async fetchJumpClientInstallers(
        tenantId: number,
        params: RetrieveJumpClientInstallersParams = {},
    ): Promise<JumpClientInstaller[]> {
        let httpParams = new HttpParams().set(
            "pageSize",
            (params.pageSize ?? +PraApiDefaults.FETCH_ALL_PAGE_SIZE).toString(),
        );

        if (params.pageNumber !== undefined) {
            httpParams = httpParams.set(
                "pageNumber",
                params.pageNumber.toString(),
            );
        }
        if (params.name !== undefined) {
            httpParams = httpParams.set("name", params.name);
        }
        if (params.hostname !== undefined) {
            httpParams = httpParams.set("hostname", params.hostname);
        }
        if (params.fqdn !== undefined) {
            httpParams = httpParams.set("fqdn", params.fqdn);
        }
        if (params.tag !== undefined) {
            httpParams = httpParams.set("tag", params.tag);
        }
        if (
            params.jumpGroupIds !== undefined &&
            params.jumpGroupIds.length > 0
        ) {
            params.jumpGroupIds.forEach((id) => {
                httpParams = httpParams.append("jumpGroupIds", id.toString());
            });
        }
        if (params.jumpGroupType !== undefined) {
            httpParams = httpParams.set("jumpGroupType", params.jumpGroupType);
        }
        if (params.connectionType !== undefined) {
            httpParams = httpParams.set(
                "connectionType",
                params.connectionType,
            );
        }
        if (params.installerId !== undefined) {
            httpParams = httpParams.set("installerId", params.installerId);
        }

        return firstValueFrom(
            this.http.get<JumpClientInstaller[]>("jump-clients/installers", {
                params: httpParams,
                ...this.createHeaders(tenantId),
            }),
        );
    }

    public async fetchJumpClientInstallerById(
        tenantId: number,
        id: number,
    ): Promise<JumpClientInstaller> {
        return firstValueFrom(
            this.http.get<JumpClientInstaller>(
                `jump-clients/installers/${id}`,
                this.createHeaders(tenantId),
            ),
        );
    }

    public async createJumpClientInstaller(
        tenantId: number,
        body: CreateJumpClientInstallerDtoInput,
    ): Promise<JumpClientInstaller> {
        return firstValueFrom(
            this.http.post<JumpClientInstaller>(
                "jump-clients/installers",
                body,
                this.createHeaders(tenantId),
            ),
        );
    }

    public async deleteJumpClientInstaller(
        tenantId: number,
        id: number,
    ): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(
                `jump-clients/installers/${id}`,
                this.createHeaders(tenantId),
            ),
        );
    }

    public downloadJumpClientInstallerPlatform(
        tenantId: number,
        installerId: string,
        platform: string,
    ): Observable<HttpEvent<Blob>> {
        const url = `jump-clients/installers/${installerId}/platforms/${platform}`;
        return this.http.get(url, {
            observe: "events",
            responseType: "blob",
            reportProgress: true,
            ...this.createHeaders(tenantId),
        });
    }
}
