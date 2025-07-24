import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormControl } from "@angular/forms";

// Services
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";
import { DefaultPolicyConfigService } from "app/views/management/services/default-policy-config.service";

// Models
import {
    DefaultPolicyConfig,
    DefaultPolicyConfigUpdateDto,
    DefaultPolicyConfigDefaultResponse,
} from "../../../../management/models";

interface DefaultPolicyConfigUpdateForm {
    contentDownloadTimeoutHours: FormControl<number>;
    contentDownloadTimeoutMinutes: FormControl<number>;
    contentDownloadTimeoutSeconds: FormControl<number>;
}

@Component({
    selector: "app-views-management-default-policy-config-update-overlay",
    templateUrl: "./update-default-policy-config-overlay.component.html",
    styleUrls: ["./update-default-policy-config-overlay.component.scss"],
})
export class UpdateDefaultPolicyConfigOverlayComponent implements OnInit {
    public defaultPolicyConfigFormGroup: FormGroup<DefaultPolicyConfigUpdateForm>;
    public isLoading: boolean;

    public hoursArray = Array.from({ length: 24 }, (_, i) => i);
    public minutesArray = Array.from({ length: 60 }, (_, i) => i);
    public secondsArray = Array.from({ length: 60 }, (_, i) => i);

    private currentDefaultPolicyConfig: DefaultPolicyConfig;

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: DefaultPolicyConfig,
        private readonly dialogRef: MatDialogRef<UpdateDefaultPolicyConfigOverlayComponent>,
        private readonly errorService: AppErrorService,
        private readonly defaultPolicyConfigService: DefaultPolicyConfigService
    ) {
        this.isLoading = false;
        this.currentDefaultPolicyConfig = this.data;
    }

    public async ngOnInit(): Promise<void> {
        this.buildItemForm();
    }

    public submitDefaultPolicyConfigHandler(): void {
        const defaultPolicyConfigDto = this.mapFormValuesToDto();

        this.updateDefaultPolicyConfigHandler(defaultPolicyConfigDto);
    }

    public closeDialog(): void {
        this.dialogRef.close(false);
    }

    private buildItemForm(): void {
        const d = this.currentDefaultPolicyConfig;
        let totalSeconds = d.contentDownloadTimeout;

        const hours = Math.floor(totalSeconds / 3600); // 3600 seconds in an hour
        totalSeconds %= 3600; // remainder of seconds after hours
        const minutes = Math.floor(totalSeconds / 60); // 60 seconds in a minute
        const seconds = totalSeconds % 60; // remainder of seconds after minutes

        this.defaultPolicyConfigFormGroup =
            new FormGroup<DefaultPolicyConfigUpdateForm>({
                contentDownloadTimeoutHours: new FormControl(hours),
                contentDownloadTimeoutMinutes: new FormControl(minutes),
                contentDownloadTimeoutSeconds: new FormControl(seconds),
            });
    }

    private mapFormValuesToDto(): DefaultPolicyConfigUpdateDto {
        const hours =
            this.defaultPolicyConfigFormGroup.controls
                .contentDownloadTimeoutHours.value;
        const minutes =
            this.defaultPolicyConfigFormGroup.controls
                .contentDownloadTimeoutMinutes.value;
        const seconds =
            this.defaultPolicyConfigFormGroup.controls
                .contentDownloadTimeoutSeconds.value;

        const contentDownloadTimeout = hours * 3600 + minutes * 60 + seconds;

        return { contentDownloadTimeout };
    }

    private async updateDefaultPolicyConfigHandler(
        defaultPolicyConfigDto: DefaultPolicyConfigUpdateDto
    ): Promise<void> {
        this.isLoading = true;
        this.defaultPolicyConfigFormGroup.disable();

        await this.defaultPolicyConfigService
            .updateDefaultPolicyConfig(defaultPolicyConfigDto)
            .then((response: DefaultPolicyConfigDefaultResponse) => {
                if (response.statusCode > 201) {
                    return this.showErrorModal(
                        response.statusCode,
                        response.message
                    );
                }
            })
            .catch((reason) => {
                this.showErrorModal(
                    reason.error.statusCode,
                    reason.error.message
                );
            });

        this.isLoading = false;
        this.dialogRef.close(true);
    }

    private showErrorModal(title: string | number, message: string): void {
        this.errorService.show({
            title: `Error - ${title.toString()}`,
            message: message,
        });
        this.defaultPolicyConfigFormGroup.enable();
    }
}
