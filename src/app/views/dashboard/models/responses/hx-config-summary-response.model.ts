import { HxConfig } from "../hx-config.model";

export interface HxConfigSummaryResponse {
    statusCode: number;
    message: {
        hxConfigs: HxConfig[];
    };
}
