import { Agent } from "./agent.model";

export interface DuplicateAgentWithMatchingMacAddress {
    agentCount: number;
    agents: Agent[];
}
