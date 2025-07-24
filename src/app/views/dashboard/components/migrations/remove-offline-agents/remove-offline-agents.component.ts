import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

import { MigrationService } from "../../../services/migration.service";

@Component({
    selector: "app-views-management-migrations-remove-offline-agents",
    templateUrl: "./remove-offline-agents.component.html",
})
export class RemoveOfflineAgentsComponent implements OnInit {
    public isRemovingOfflineAgents: boolean;
    public hasRemovedOfflineAgents: boolean;
    public migrationProcessCompleted: boolean;

    constructor(
        private readonly dialogRef: MatDialogRef<RemoveOfflineAgentsComponent>,
        private readonly errorService: AppErrorService,
        private readonly migrationService: MigrationService
    ) {
        this.isRemovingOfflineAgents = false;
        this.hasRemovedOfflineAgents = false;
        this.migrationProcessCompleted = false;
    }

    public async ngOnInit(): Promise<void> {
        await this.removeOfflineAgents();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private async removeOfflineAgents(): Promise<void> {
        this.isRemovingOfflineAgents = true;

        try {
            await this.migrationService.removeOfflineAgents();
            this.isRemovingOfflineAgents = false;
            this.hasRemovedOfflineAgents = true;
            this.migrationProcessCompleted = true;
        } catch (error) {
            console.warn("Offline Agents Removal: ", JSON.stringify(error));
            if (error.message) {
                this.showErrorModal("Offline Agents Removal", error.message);
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
