import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    HxConfig,
    HxConfigAddDto,
    HxConfigDefaultResponse,
    HxConfigSummaryResponse,
    HxConfigUpdateDto,
    HxCredentials,
} from "../models";

@Injectable()
export class HxConfigService {
    constructor(private http: HttpClient) {}

    public async findAllHxConfigs(): Promise<HxConfig[]> {
        const result = await firstValueFrom(
            this.http.get<HxConfigSummaryResponse>("hx-configs/summary")
        );

        return Promise.resolve(result.message.hxConfigs);
    }

    public async createHxConfig(
        hxConfig: HxConfigAddDto
    ): Promise<HxConfigDefaultResponse> {
        return await firstValueFrom(
            this.http.post<HxConfigDefaultResponse>(
                "hx-configs/create",
                hxConfig
            )
        );
    }

    public async updateHxConfig(
        hxConfig: HxConfigUpdateDto
    ): Promise<HxConfigDefaultResponse> {
        return await firstValueFrom(
            this.http.put<HxConfigDefaultResponse>(
                "hx-configs/update",
                hxConfig
            )
        );
    }

    public async deleteHxConfig(
        hxConfigId: number
    ): Promise<HxConfigDefaultResponse> {
        return await firstValueFrom(
            this.http.delete<HxConfigDefaultResponse>(
                `hx-configs/remove/${hxConfigId}`
            )
        );
    }

    public async checkHxApiHealth(
        hxCredentials: HxCredentials
    ): Promise<HxConfigDefaultResponse> {
        return await firstValueFrom(
            this.http.post<HxConfigDefaultResponse>(
                "hx-api-health",
                hxCredentials
            )
        );
    }
}
