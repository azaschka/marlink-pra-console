import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

import { MigrationService } from "../../../services/migration.service";

import { Agent } from "../../../models";

@Component({
    selector: "app-views-management-migrations-remove-duplicate-agents",
    templateUrl: "./remove-duplicate-agents.component.html",
})
export class RemoveDuplicateAgentsComponent implements OnInit {
    public isFetchingDuplicateAgents: boolean;
    public hasFetchedDuplicateAgents: boolean;
    public isRemovingDuplicateAgents: boolean;
    public hasRemovedDuplicateAgents: boolean;
    public migrationProcessCompleted: boolean;
    public agentIdsToRemove: number[];

    constructor(
        private readonly dialogRef: MatDialogRef<RemoveDuplicateAgentsComponent>,
        private readonly errorService: AppErrorService,
        private readonly migrationService: MigrationService
    ) {
        this.isFetchingDuplicateAgents = false;
        this.hasFetchedDuplicateAgents = false;
        this.isRemovingDuplicateAgents = false;
        this.hasRemovedDuplicateAgents = false;
        this.migrationProcessCompleted = false;
        this.agentIdsToRemove = [];
    }

    public async ngOnInit(): Promise<void> {
        await this.findDuplicateAgents();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private async findDuplicateAgents(): Promise<void> {
        this.isFetchingDuplicateAgents = true;
        this.isRemovingDuplicateAgents = true;

        try {
            const duplicateAgents =
                await this.migrationService.findAllDuplicateAgentsWithMatchingMacAddress();

            this.isFetchingDuplicateAgents = false;
            this.hasFetchedDuplicateAgents = true;

            let agentsToRemove: Agent[] = [];
            agentsToRemove = duplicateAgents.reduce((acc, duplicateAgent) => {
                return acc.concat(duplicateAgent.agents);
            }, agentsToRemove);
            console.log("Duplicate Agents: ", agentsToRemove);
            await this.removeDuplicateAgents(agentsToRemove);
        } catch (error) {
            console.warn("Duplicate Agents Fetch: ", JSON.stringify(error));
            if (error.message) {
                this.showErrorModal("Duplicate Agents Fetch", error.message);
            }
            this.closeDialog();
        }
    }

    private async removeDuplicateAgents(
        agentsToRemove: Agent[]
    ): Promise<void> {
        this.isRemovingDuplicateAgents = true;

        const agentIdsToDeactivate =
            agentsToRemove
                .filter((a) => a.status === "installed")
                .map((a) => a.id) || [];

        if (agentIdsToDeactivate.length > 0) {
            await this.migrationService.deactivateAgents(agentIdsToDeactivate);
        }

        this.agentIdsToRemove = agentsToRemove.map((a) => a.id);

        try {
            await this.migrationService.removeAgents(this.agentIdsToRemove);
            this.isRemovingDuplicateAgents = false;
            this.hasRemovedDuplicateAgents = true;
            this.migrationProcessCompleted = true;
        } catch (error) {
            console.warn("Duplicate Agents Removal: ", JSON.stringify(error));
            if (error.message) {
                this.showErrorModal("Duplicate Agents Removal", error.message);
            }
            this.closeDialog();
        }
    }

    private showErrorModal(title: string | number, message: string): void {
        this.errorService.show({
            title: `Error - ${title.toString()}`,
            message: message,
        });
    }
}
