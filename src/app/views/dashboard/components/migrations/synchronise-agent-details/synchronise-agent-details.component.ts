import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

import { MigrationService } from "../../../services/migration.service";

@Component({
    selector: "app-views-management-migrations-synchronise-agent-details",
    templateUrl: "./synchronise-agent-details.component.html",
})
export class SynchroniseAgentDetailsComponent implements OnInit {
    public isSynchronisingAgentDetails: boolean;
    public hasSynchronisedAgentDetails: boolean;
    public migrationProcessCompleted: boolean;

    constructor(
        private readonly dialogRef: MatDialogRef<SynchroniseAgentDetailsComponent>,
        private readonly errorService: AppErrorService,
        private readonly migrationService: MigrationService
    ) {
        this.isSynchronisingAgentDetails = false;
        this.hasSynchronisedAgentDetails = false;
        this.migrationProcessCompleted = false;
    }

    public async ngOnInit(): Promise<void> {
        await this.checkAgentDetails();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private async checkAgentDetails(): Promise<void> {
        this.isSynchronisingAgentDetails = true;

        try {
            const processId =
                await this.migrationService.startAgentDetailsCheckProcess();

            // Polling for the process status
            const checkStatus = async () => {
                try {
                    const status =
                        await this.migrationService.checkAgentDetailsCheckProcessStatus(
                            processId
                        );

                    if (status === "Unknown ID") {
                        this.showErrorModal(
                            "Agent Details",
                            "Process ID unknown. Internal error."
                        );
                        this.closeDialog();
                        return;
                    }

                    if (status === "Completed") {
                        this.isSynchronisingAgentDetails = false;
                        this.hasSynchronisedAgentDetails = true;
                        this.migrationProcessCompleted = true;
                    } else {
                        setTimeout(checkStatus, 10000);
                    }
                } catch (error) {
                    this.showErrorModal(
                        "Agent Details Process Status",
                        error.message
                    );
                    this.closeDialog();
                }
            };

            checkStatus();
        } catch (error) {
            console.warn("Agent Details Error: ", JSON.stringify(error));
            if (error.message) {
                this.showErrorModal("Agent Details", error.message);
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
