import { DuplicateAgentWithMatchingMacAddress } from "../duplicate-agent-with-matching-mac-address.model";

export interface DuplicateAgentsResponse {
    statusCode: number;
    message: {
        duplicateAgents: DuplicateAgentWithMatchingMacAddress[];
    };
}
