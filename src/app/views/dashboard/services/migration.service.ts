import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { catchError, firstValueFrom, retry, timeout } from "rxjs";
import {
    DuplicateAgentWithMatchingMacAddress,
    DuplicateAgentsResponse,
    MigrationDefaultResponse,
} from "../models";

@Injectable()
export class MigrationService {
    constructor(private http: HttpClient) {}

    public async startAgentDetailsCheckProcess(): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            "migrations/start-agent-details-check-process"
        );
    }

    public async startAgentDuplicatesCheckProcess(): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            "migrations/start-agent-duplicates-check-process"
        );
    }

    public async startDuplicateSubscriptionRemovalProcess(): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            "migrations/start-duplicate-subscription-removal-process"
        );
    }

    public async startMigrateProfilesProcess(): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            "migrations/start-migrate-profiles-process"
        );
    }

    public async checkAgentDetailsCheckProcessStatus(
        processId: string
    ): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            `migrations/agent-details-check-process-status/${processId}`
        );
    }

    public async checkAgentDuplicatesCheckProcessStatus(
        processId: string
    ): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            `migrations/agent-duplicates-check-process-status/${processId}`
        );
    }

    public async checkDuplicateSubscriptionRemovalProcessStatus(
        processId: string
    ): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            `migrations/duplicate-subscription-removal-process-status/${processId}`
        );
    }

    public async migrateProfilesProcessStatus(
        processId: string
    ): Promise<string> {
        return await this.executeHttpGetRequestWithUrl(
            `migrations/migrate-profiles-process-status/${processId}`
        );
    }

    public async findAllDuplicateAgentsWithMatchingMacAddress(): Promise<
        DuplicateAgentWithMatchingMacAddress[]
    > {
        const result = await firstValueFrom(
            this.http.get<DuplicateAgentsResponse>(
                "agents/duplicates-with-matching-mac-address"
            )
        );

        return Promise.resolve(result.message.duplicateAgents);
    }

    public async deactivateAgents(
        ids: number[]
    ): Promise<MigrationDefaultResponse> {
        return await firstValueFrom(
            this.http.put<MigrationDefaultResponse>(
                "agents/console-deactivate",
                {
                    ids,
                }
            )
        );
    }

    public async removeOfflineAgents(): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(`agents/console-remove-offline-agents`)
        );
    }

    public async removeAgents(ids: number[]): Promise<void> {
        for (const id of ids) {
            try {
                await this.removeAgent(id);
            } catch (reason) {
                console.error(reason);
            }
        }
    }

    private async removeAgent(id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(`agents/console-remove/${id}`)
        );
    }

    private async executeHttpGetRequestWithUrl(url: string): Promise<string> {
        return await firstValueFrom(
            this.http
                .get(`${url}`, {
                    responseType: "text", // Expecting a text response
                    headers: new HttpHeaders({
                        Accept: "application/json",
                    }),
                })
                .pipe(
                    timeout(60000),
                    retry(3),
                    catchError((error) => {
                        throw new Error(error);
                    })
                )
        );
    }
}
