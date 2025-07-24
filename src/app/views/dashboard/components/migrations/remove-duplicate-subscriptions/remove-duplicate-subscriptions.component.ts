import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

import { MigrationService } from "../../../services/migration.service";

@Component({
    selector: "app-views-management-migrations-remove-duplicate-subscriptions",
    templateUrl: "./remove-duplicate-subscriptions.component.html",
})
export class RemoveDuplicateSubscriptionsComponent implements OnInit {
    public isRemovingDuplicateSubscriptions: boolean;
    public hasRemovedDuplicateSubscriptions: boolean;
    public migrationProcessCompleted: boolean;

    constructor(
        private readonly dialogRef: MatDialogRef<RemoveDuplicateSubscriptionsComponent>,
        private readonly errorService: AppErrorService,
        private readonly migrationService: MigrationService
    ) {
        this.isRemovingDuplicateSubscriptions = false;
        this.hasRemovedDuplicateSubscriptions = false;
        this.migrationProcessCompleted = false;
    }

    public async ngOnInit(): Promise<void> {
        await this.checkAgentDetails();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private async checkAgentDetails(): Promise<void> {
        this.isRemovingDuplicateSubscriptions = true;

        try {
            const processId =
                await this.migrationService.startDuplicateSubscriptionRemovalProcess();

            // Polling for the process status
            const checkStatus = async () => {
                try {
                    const status =
                        await this.migrationService.checkDuplicateSubscriptionRemovalProcessStatus(
                            processId
                        );

                    if (status === "Unknown ID") {
                        this.showErrorModal(
                            "Duplicate Subscription Removal",
                            "Process ID unknown. Internal error."
                        );
                        this.closeDialog();
                        return;
                    }

                    if (status === "Completed") {
                        this.isRemovingDuplicateSubscriptions = false;
                        this.hasRemovedDuplicateSubscriptions = true;
                        this.migrationProcessCompleted = true;
                    } else {
                        setTimeout(checkStatus, 10000);
                    }
                } catch (error) {
                    this.showErrorModal(
                        "Duplicate Subscription Removal Process Status",
                        error.message
                    );
                    this.closeDialog();
                }
            };

            checkStatus();
        } catch (error) {
            console.warn(
                "Duplicate Subscription Removal: ",
                JSON.stringify(error)
            );
            if (error.message) {
                this.showErrorModal(
                    "Duplicate Subscription Removal",
                    error.message
                );
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
