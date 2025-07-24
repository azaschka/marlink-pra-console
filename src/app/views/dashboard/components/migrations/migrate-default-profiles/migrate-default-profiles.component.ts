import { Component, OnInit } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

import { MigrationService } from "../../../services/migration.service";

@Component({
    selector: "app-views-management-migrations-migrate-default-profiles",
    templateUrl: "./migrate-default-profiles.component.html",
})
export class MigrateDefaultProfilesComponent implements OnInit {
    public isMigratingProfiles: boolean;
    public hasMigratedProfiles: boolean;
    public migrationProcessCompleted: boolean;

    constructor(
        private readonly dialogRef: MatDialogRef<MigrateDefaultProfilesComponent>,
        private readonly errorService: AppErrorService,
        private readonly migrationService: MigrationService
    ) {
        this.isMigratingProfiles = false;
        this.hasMigratedProfiles = false;
        this.migrationProcessCompleted = false;
    }

    public async ngOnInit(): Promise<void> {
        await this.startProfileMigration();
    }

    public closeDialog(): void {
        this.dialogRef.close();
    }

    private async startProfileMigration(): Promise<void> {
        this.isMigratingProfiles = true;

        try {
            const processId =
                await this.migrationService.startMigrateProfilesProcess();

            // Polling for the process status
            const checkStatus = async () => {
                try {
                    const status =
                        await this.migrationService.migrateProfilesProcessStatus(
                            processId
                        );

                    if (status === "Unknown ID") {
                        this.showErrorModal(
                            "Migrate Profiles",
                            "Process ID unknown. Internal error."
                        );
                        this.closeDialog();
                        return;
                    }

                    if (status === "Completed") {
                        this.isMigratingProfiles = false;
                        this.hasMigratedProfiles = true;
                        this.migrationProcessCompleted = true;
                    } else {
                        setTimeout(checkStatus, 10000);
                    }
                } catch (error) {
                    this.showErrorModal(
                        "Migrate Profiles Process Status",
                        error.message
                    );
                    this.closeDialog();
                }
            };

            checkStatus();
        } catch (error) {
            console.warn("Migrate Profiles: ", JSON.stringify(error));
            if (error.message) {
                this.showErrorModal("Migrate Profiles", error.message);
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
