import { Injectable } from "@angular/core";
import { PraApiDefaults } from "../../shared/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    JumpAssetCopyRequest,
    JumpAssetUpdateRequest,
    CreateProtocolTunnelJumpDtoInput,
    CreateRemoteRdpDtoInput,
    CreateRemoteVncDtoInput,
    CreateShellJumpDtoInput,
    CreateWebJumpDtoInput,
    JumpClient,
    ProtocolTunnelJump,
    RemoteRdp,
    RemoteVnc,
    ShellJump,
    WebJump,
    JumpClientInstaller,
    CreateJumpClientInstallerDtoInput,
} from "./models";
import {
    JumpClientConnectionType,
    JumpClientGroupType,
    JumpClientInstallerPlatformType,
} from "./enums";

@Injectable()
export class JumpAssetsService {
    constructor(private http: HttpClient) {}

    private createHeaders(tenantId: number) {
        return { headers: { "X-Tenant-Id": tenantId.toString() } };
    }

    /* --- Remote RDP ---------------------------------------------------- */
    public async fetchRemoteRdps(tenantId: number): Promise<RemoteRdp[]> {
        return this.get<RemoteRdp[]>("jump-items/remote-rdps", tenantId);
    }
    public async createRemoteRdp(
        tenantId: number,
        body: CreateRemoteRdpDtoInput
    ): Promise<RemoteRdp> {
        return this.post<RemoteRdp>("jump-items/remote-rdps", body, tenantId);
    }
    public async updateRemoteRdp(
        tenantId: number,
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<RemoteRdp> {
        return this.patch<RemoteRdp>(
            `jump-items/remote-rdps/${id}`,
            body,
            tenantId
        );
    }
    public async deleteRemoteRdp(tenantId: number, id: number): Promise<void> {
        return this.delete(`jump-items/remote-rdps/${id}`, tenantId);
    }
    public async copyRemoteRdp(
        tenantId: number,
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<RemoteRdp> {
        return firstValueFrom(
            this.http.post<RemoteRdp>(
                `jump-items/remote-rdps/${id}/copy`,
                body,
                this.createHeaders(tenantId)
            )
        );
    }

    /* --- Remote VNC ---------------------------------------------------- */
    public async fetchRemoteVncs(tenantId: number): Promise<RemoteVnc[]> {
        return this.get<RemoteVnc[]>("jump-items/remote-vncs", tenantId);
    }
    public async createRemoteVnc(
        tenantId: number,
        body: CreateRemoteVncDtoInput
    ): Promise<RemoteVnc> {
        return this.post<RemoteVnc>("jump-items/remote-vncs", body, tenantId);
    }
    public async updateRemoteVnc(
        tenantId: number,
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<RemoteVnc> {
        return this.patch<RemoteVnc>(
            `jump-items/remote-vncs/${id}`,
            body,
            tenantId
        );
    }
    public async deleteRemoteVnc(tenantId: number, id: number): Promise<void> {
        return this.delete(`jump-items/remote-vncs/${id}`, tenantId);
    }
    public async copyRemoteVnc(
        tenantId: number,
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<RemoteVnc> {
        return this.post<RemoteVnc>(
            `jump-items/remote-vncs/${id}/copy`,
            body,
            tenantId
        );
    }

    /* --- Shell Jump ---------------------------------------------------- */
    public async fetchShellJumps(tenantId: number): Promise<ShellJump[]> {
        return this.get<ShellJump[]>("jump-items/shell-jumps", tenantId);
    }
    public async createShellJump(
        tenantId: number,
        body: CreateShellJumpDtoInput
    ): Promise<ShellJump> {
        return this.post<ShellJump>("jump-items/shell-jumps", body, tenantId);
    }
    public async updateShellJump(
        tenantId: number,
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<ShellJump> {
        return this.patch<ShellJump>(
            `jump-items/shell-jumps/${id}`,
            body,
            tenantId
        );
    }
    public async deleteShellJump(tenantId: number, id: number): Promise<void> {
        return this.delete(`jump-items/shell-jumps/${id}`, tenantId);
    }
    public async copyShellJump(
        tenantId: number,
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<ShellJump> {
        return this.post<ShellJump>(
            `jump-items/shell-jumps/${id}/copy`,
            body,
            tenantId
        );
    }

    /* --- Web Jump ------------------------------------------------------ */
    public async fetchWebJumps(tenantId: number): Promise<WebJump[]> {
        return this.get<WebJump[]>("jump-items/web-jumps", tenantId);
    }
    public async createWebJump(
        tenantId: number,
        body: CreateWebJumpDtoInput
    ): Promise<WebJump> {
        return this.post<WebJump>("jump-items/web-jumps", body, tenantId);
    }
    public async updateWebJump(
        tenantId: number,
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<WebJump> {
        return this.patch<WebJump>(
            `jump-items/web-jumps/${id}`,
            body,
            tenantId
        );
    }
    public async deleteWebJump(tenantId: number, id: number): Promise<void> {
        return this.delete(`jump-items/web-jumps/${id}`, tenantId);
    }
    public async copyWebJump(
        tenantId: number,
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<WebJump> {
        return this.post<WebJump>(
            `jump-items/web-jumps/${id}/copy`,
            body,
            tenantId
        );
    }

    /* --- Protocol Tunnel Jump ----------------------------------------- */
    public async fetchProtocolTunnelJumps(
        tenantId: number
    ): Promise<ProtocolTunnelJump[]> {
        return this.get<ProtocolTunnelJump[]>(
            "jump-items/protocol-tunnel-jumps",
            tenantId
        );
    }
    public async createProtocolTunnelJump(
        tenantId: number,
        body: CreateProtocolTunnelJumpDtoInput
    ): Promise<ProtocolTunnelJump> {
        return this.post<ProtocolTunnelJump>(
            "jump-items/protocol-tunnel-jumps",
            body,
            tenantId
        );
    }
    public async updateProtocolTunnelJump(
        tenantId: number,
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<ProtocolTunnelJump> {
        return this.patch<ProtocolTunnelJump>(
            `jump-items/protocol-tunnel-jumps/${id}`,
            body,
            tenantId
        );
    }
    public async deleteProtocolTunnelJump(
        tenantId: number,
        id: number
    ): Promise<void> {
        return this.delete(`jump-items/protocol-tunnel-jumps/${id}`, tenantId);
    }
    public async copyProtocolTunnelJump(
        tenantId: number,
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<ProtocolTunnelJump> {
        return this.post<ProtocolTunnelJump>(
            `jump-items/protocol-tunnel-jumps/${id}/copy`,
            body,
            tenantId
        );
    }

    /* --- Jump Clients -------------------------------------------------- */
    public async fetchJumpClients(tenantId: number): Promise<JumpClient[]> {
        return this.get<JumpClient[]>("jump-clients", tenantId);
    }
    public async updateJumpClient(
        tenantId: number,
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<JumpClient> {
        return this.patch<JumpClient>(`jump-clients/${id}`, body, tenantId);
    }
    public async deleteJumpClient(tenantId: number, id: number): Promise<void> {
        return this.delete(`jump-clients/${id}`, tenantId);
    }
    public async copyJumpClient(
        tenantId: number,
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<JumpClient> {
        return this.post<JumpClient>(`jump-clients/${id}/copy`, body, tenantId);
    }

    /* --- Jump Client Installers --------------------------------------- */
    public async fetchJumpClientInstallers(
        tenantId: number
    ): Promise<JumpClientInstaller[]> {
        return this.get<JumpClientInstaller[]>(
            "jump-clients/installers",
            tenantId
        );
    }
    public async createJumpClientInstaller(
        tenantId: number,
        body: CreateJumpClientInstallerDtoInput
    ): Promise<JumpClientInstaller> {
        return this.post<JumpClientInstaller>(
            "jump-clients/installers",
            body,
            tenantId
        );
    }
    public async deleteJumpClientInstaller(
        tenantId: number,
        id: number
    ): Promise<void> {
        await this.delete(`jump-clients/installers/${id}`, tenantId);
    }
    public async downloadJumpClientInstallerPlatform(
        tenantId: number,
        installerId: string,
        platformType: JumpClientInstallerPlatformType
    ): Promise<Blob> {
        return firstValueFrom(
            this.http.get(
                `jump-clients/installers/${installerId}/platforms/${platformType}`,
                { responseType: "blob", ...this.createHeaders(tenantId) }
            )
        );
    }

    /* ------------------------------------------------------------------ */
    private async get<T>(url: string, tenantId: number): Promise<T> {
        const params = new HttpParams().set("pageSize", PraApiDefaults.FETCH_ALL_PAGE_SIZE);
        return firstValueFrom(
            this.http.get<T>(`${url}`, {
                params,
                ...this.createHeaders(tenantId),
            })
        );
    }
    private async post<T>(
        url: string,
        body: any,
        tenantId: number
    ): Promise<T> {
        return firstValueFrom(
            this.http.post<T>(url, body, this.createHeaders(tenantId))
        );
    }
    private async patch<T>(
        url: string,
        body: any,
        tenantId: number
    ): Promise<T> {
        return firstValueFrom(
            this.http.patch<T>(url, body, this.createHeaders(tenantId))
        );
    }
    private async delete(url: string, tenantId: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(url, this.createHeaders(tenantId))
        );
    }
}
