import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    DefaultPolicyConfig,
    DefaultPolicyConfigDefaultResponse,
    DefaultPolicyConfigSummaryResponse,
    DefaultPolicyConfigUpdateDto,
} from "../models";

@Injectable()
export class DefaultPolicyConfigService {
    constructor(private http: HttpClient) {}

    public async fetchDefaultPolicyConfig(): Promise<DefaultPolicyConfig> {
        const result = await firstValueFrom(
            this.http.get<DefaultPolicyConfigSummaryResponse>(
                "profiles/default-policy-config"
            )
        );

        return Promise.resolve(result.message.defaultPolicyConfig);
    }

    public async updateDefaultPolicyConfig(
        defaultPolicyConfigDto: DefaultPolicyConfigUpdateDto
    ): Promise<DefaultPolicyConfigDefaultResponse> {
        return await firstValueFrom(
            this.http.put<DefaultPolicyConfigDefaultResponse>(
                "profiles/default-policy-config",
                defaultPolicyConfigDto
            )
        );
    }
}
