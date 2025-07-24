import { DefaultPolicyConfig } from "../default-policy-config.model";

export interface DefaultPolicyConfigSummaryResponse {
    statusCode: number;
    message: {
        defaultPolicyConfig: DefaultPolicyConfig;
    };
}
