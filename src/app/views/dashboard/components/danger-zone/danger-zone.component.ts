import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { ConfirmDialogService } from "app/shared/dialogs/confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "app/shared/dialogs/error-dialog/error-dialog.service";
import { NotificationDialogService } from "app/shared/dialogs/notification-dialog/notification-dialog.service";
import { DangerZoneService } from "./danger-zone.service";
import { ResetDataResult } from "./models";

@Component({
    selector: "app-dashboard-danger-zone",
    templateUrl: "./danger-zone.component.html",
    styleUrls: ["./danger-zone.component.scss"],
})
export class DangerZoneComponent {
    public static readonly CONFIRMATION_PHRASE = "RESET-DATA";

    public readonly confirmationPhrase = DangerZoneComponent.CONFIRMATION_PHRASE;
    public readonly confirmationControl = new FormControl<string>("", {
        nonNullable: true,
    });

    public isLoading = false;
    public previewResult: ResetDataResult | null = null;

    constructor(
        private readonly dangerZoneService: DangerZoneService,
        private readonly confirmDialog: ConfirmDialogService,
        private readonly errorDialog: ErrorDialogService,
        private readonly notificationDialog: NotificationDialogService
    ) {}

    public get isConfirmationValid(): boolean {
        return this.confirmationControl.value.trim() === this.confirmationPhrase;
    }

    public async previewResetHandler(): Promise<void> {
        try {
            this.isLoading = true;
            this.previewResult = await this.dangerZoneService.previewReset();
        } catch (error: unknown) {
            await this.showError(error);
        } finally {
            this.isLoading = false;
        }
    }

    public async resetDataHandler(): Promise<void> {
        if (!this.isConfirmationValid) {
            return;
        }

        const confirmed = await this.confirmDialog.show({
            title: "Reset ALL data",
            message:
                "This will permanently truncate all data tables (except PRA users, " +
                "access keys and BeyondTrust instances) and delete all backup files. " +
                "This action cannot be undone. Are you absolutely sure?",
        });

        if (!confirmed) {
            return;
        }

        try {
            this.isLoading = true;
            const result = await this.dangerZoneService.resetData(
                this.confirmationPhrase
            );

            this.previewResult = result;
            this.confirmationControl.reset();

            this.notificationDialog.show({
                message:
                    `Data reset complete: ${result.truncatedTables.length} tables truncated. ` +
                    `Repopulation from BeyondTrust runs in the background.`,
                icon: "check_circle",
                duration: 10000,
            });
        } catch (error: unknown) {
            await this.showError(error);
        } finally {
            this.isLoading = false;
        }
    }

    private async showError(error: unknown): Promise<void> {
        const message =
            error instanceof Error
                ? error.message
                : "An unexpected error occurred while resetting the data.";

        await this.errorDialog.show({
            title: "Data reset failed",
            message,
        });
    }
}
