import { Injectable } from "@angular/core";
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
} from "./models";

@Injectable()
export class JumpAssetsService {
    constructor(private http: HttpClient) {}

    /* --- Remote RDP ---------------------------------------------------- */
    public async fetchRemoteRdps(): Promise<RemoteRdp[]> {
        return this.get<RemoteRdp[]>("jump-items/remote-rdps");
    }
    public async createRemoteRdp(
        body: CreateRemoteRdpDtoInput
    ): Promise<RemoteRdp> {
        return this.post<RemoteRdp>("jump-items/remote-rdps", body);
    }
    public async updateRemoteRdp(
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<RemoteRdp> {
        return this.patch<RemoteRdp>(`jump-items/remote-rdps/${id}`, body);
    }
    public async deleteRemoteRdp(id: number): Promise<void> {
        return this.delete(`jump-items/remote-rdps/${id}`);
    }
    public async copyRemoteRdp(
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<RemoteRdp> {
        return firstValueFrom(
            this.http.post<RemoteRdp>(`jump-items/remote-rdps/${id}/copy`, body)
        );
    }

    /* --- Remote VNC ---------------------------------------------------- */
    public async fetchRemoteVncs(): Promise<RemoteVnc[]> {
        return this.get<RemoteVnc[]>("jump-items/remote-vncs");
    }
    public async createRemoteVnc(
        body: CreateRemoteVncDtoInput
    ): Promise<RemoteVnc> {
        return this.post<RemoteVnc>("jump-items/remote-vncs", body);
    }
    public async updateRemoteVnc(
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<RemoteVnc> {
        return this.patch<RemoteVnc>(`jump-items/remote-vncs/${id}`, body);
    }
    public async deleteRemoteVnc(id: number): Promise<void> {
        return this.delete(`jump-items/remote-vncs/${id}`);
    }
    public async copyRemoteVnc(
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<RemoteVnc> {
        return firstValueFrom(
            this.http.post<RemoteVnc>(`jump-items/remote-vncs/${id}/copy`, body)
        );
    }

    /* --- Shell Jump ---------------------------------------------------- */
    public async fetchShellJumps(): Promise<ShellJump[]> {
        return this.get<ShellJump[]>("jump-items/shell-jumps");
    }
    public async createShellJump(
        body: CreateShellJumpDtoInput
    ): Promise<ShellJump> {
        return this.post<ShellJump>("jump-items/shell-jumps", body);
    }
    public async updateShellJump(
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<ShellJump> {
        return this.patch<ShellJump>(`jump-items/shell-jumps/${id}`, body);
    }
    public async deleteShellJump(id: number): Promise<void> {
        return this.delete(`jump-items/shell-jumps/${id}`);
    }
    public async copyShellJump(
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<ShellJump> {
        return firstValueFrom(
            this.http.post<ShellJump>(`jump-items/shell-jumps/${id}/copy`, body)
        );
    }

    /* --- Web Jump ------------------------------------------------------ */
    public async fetchWebJumps(): Promise<WebJump[]> {
        return this.get<WebJump[]>("jump-items/web-jumps");
    }
    public async createWebJump(body: CreateWebJumpDtoInput): Promise<WebJump> {
        return this.post<WebJump>("jump-items/web-jumps", body);
    }
    public async updateWebJump(
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<WebJump> {
        return this.patch<WebJump>(`jump-items/web-jumps/${id}`, body);
    }
    public async deleteWebJump(id: number): Promise<void> {
        return this.delete(`jump-items/web-jumps/${id}`);
    }
    public async copyWebJump(
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<WebJump> {
        return firstValueFrom(
            this.http.post<WebJump>(`jump-items/web-jumps/${id}/copy`, body)
        );
    }

    /* --- Protocol Tunnel Jump ----------------------------------------- */
    public async fetchProtocolTunnelJumps(): Promise<ProtocolTunnelJump[]> {
        return this.get<ProtocolTunnelJump[]>(
            "jump-items/protocol-tunnel-jumps"
        );
    }
    public async createProtocolTunnelJump(
        body: CreateProtocolTunnelJumpDtoInput
    ): Promise<ProtocolTunnelJump> {
        return this.post<ProtocolTunnelJump>(
            "jump-items/protocol-tunnel-jumps",
            body
        );
    }
    public async updateProtocolTunnelJump(
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<ProtocolTunnelJump> {
        return this.patch<ProtocolTunnelJump>(
            `jump-items/protocol-tunnel-jumps/${id}`,
            body
        );
    }
    public async deleteProtocolTunnelJump(id: number): Promise<void> {
        return this.delete(`jump-items/protocol-tunnel-jumps/${id}`);
    }
    public async copyProtocolTunnelJump(
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<ProtocolTunnelJump> {
        return firstValueFrom(
            this.http.post<ProtocolTunnelJump>(
                `jump-items/protocol-tunnel-jumps/${id}/copy`,
                body
            )
        );
    }

    /* --- Jump Clients -------------------------------------------------- */
    public async fetchJumpClients(): Promise<JumpClient[]> {
        return this.get<JumpClient[]>("jump-clients");
    }
    // TODO: Implement createJumpClient creation logic.
    public async updateJumpClient(
        id: number,
        body: JumpAssetUpdateRequest
    ): Promise<JumpClient> {
        return this.patch<JumpClient>(`jump-clients/${id}`, body);
    }
    public async deleteJumpClient(id: number): Promise<void> {
        return this.delete(`jump-clients/${id}`);
    }
    public async copyJumpClient(
        id: number,
        body: JumpAssetCopyRequest
    ): Promise<JumpClient> {
        return firstValueFrom(
            this.http.post<JumpClient>(`jump-clients/${id}/copy`, body)
        );
    }

    /* ------------------------------------------------------------------ */
    private async get<T>(url: string): Promise<T> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(this.http.get<T>(`${url}`, { params }));
    }
    private async post<T>(url: string, body: any): Promise<T> {
        return firstValueFrom(this.http.post<T>(url, body));
    }
    private async patch<T>(url: string, body: any): Promise<T> {
        return firstValueFrom(this.http.patch<T>(url, body));
    }
    private async delete(url: string): Promise<void> {
        return firstValueFrom(this.http.delete<void>(url));
    }
}
