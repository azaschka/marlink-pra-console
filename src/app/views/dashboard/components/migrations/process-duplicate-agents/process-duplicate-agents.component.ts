import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

import { MigrationService } from "../../../services/migration.service";

@Component({
    selector: "app-views-management-migrations-process-duplicate-agents",
    templateUrl: "./process-duplicate-agents.component.html",
})
export class ProcessDuplicateAgentsComponent implements OnInit {
    public isProcessingAgentDuplicates: boolean;
    public hasProcessedAgentDuplicates: boolean;
    public migrationProcessCompleted: boolean;

    constructor(
        private readonly dialogRef: MatDialogRef<ProcessDuplicateAgentsComponent>,
        private readonly errorService: AppErrorService,
        private readonly migrationService: MigrationService
    ) {
        this.isProcessingAgentDuplicates = false;
        this.hasProcessedAgentDuplicates = false;
        this.migrationProcessCompleted = false;
    }

    public async ngOnInit(): Promise<void> {
        await this.processAgentDuplicates();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private async processAgentDuplicates(): Promise<void> {
        this.isProcessingAgentDuplicates = true;

        try {
            const processId =
                await this.migrationService.startAgentDuplicatesCheckProcess();

            // Polling for the process status
            const checkStatus = async () => {
                try {
                    const status =
                        await this.migrationService.checkAgentDuplicatesCheckProcessStatus(
                            processId
                        );

                    if (status === "Unknown ID") {
                        this.showErrorModal(
                            "Agent Duplicates",
                            "Process ID unknown. Internal error."
                        );
                        this.closeDialog();
                        return;
                    }

                    if (status === "Completed") {
                        this.isProcessingAgentDuplicates = false;
                        this.hasProcessedAgentDuplicates = true;
                        this.migrationProcessCompleted = true;
                    } else {
                        setTimeout(checkStatus, 10000);
                    }
                } catch (error) {
                    this.showErrorModal(
                        "Agent Duplicates Process Status",
                        error.message
                    );
                    this.closeDialog();
                }
            };

            checkStatus();
        } catch (error) {
            console.warn("Agent Duplicates Error: ", JSON.stringify(error));
            if (error.message) {
                this.showErrorModal("Agent Duplicates", error.message);
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
