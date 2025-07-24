import { ClientVersions } from "../client-versions.model";

export interface ClientVersionsSummaryResponse {
    statusCode: number;
    message: {
        summary: ClientVersions;
    };
}
