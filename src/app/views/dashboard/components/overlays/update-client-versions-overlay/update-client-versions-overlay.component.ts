import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
    Validators,
    FormGroup,
    FormControl,
    AbstractControl,
} from "@angular/forms";

// Services
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";
import { ClientVersionsService } from "../../../../management/services/client-versions.service";

// Models
import {
    ClientVersions,
    ClientVersionAddDto,
} from "../../../../management/models";

interface ClientVersionsUpdateForm {
    installerVersion: FormControl<string>;
    installerDownloadUrl: FormControl<string>;
    apacheVersion: FormControl<string>;
    apacheDownloadUrl: FormControl<string>;
    phpVersion: FormControl<string>;
    phpDownloadUrl: FormControl<string>;
    trellixMsiVersion: FormControl<string>;
    trellixMsiDownloadUrl: FormControl<string>;
}

@Component({
    selector: "app-views-management-client-versions-update-overlay",
    templateUrl: "./update-client-versions-overlay.component.html",
    styleUrls: ["./update-client-versions-overlay.component.scss"],
})
export class UpdateClientVersionsOverlayComponent implements OnInit {
    public clientVersionsFormGroup: FormGroup<ClientVersionsUpdateForm>;
    public isLoading: boolean;

    private clientVersionsBefore: ClientVersions;

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: ClientVersions,
        private readonly dialogRef: MatDialogRef<UpdateClientVersionsOverlayComponent>,
        private readonly errorService: AppErrorService,
        private readonly clientVersionsService: ClientVersionsService
    ) {
        this.isLoading = false;
        this.clientVersionsBefore = this.data;
    }

    public get installerVersion(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("installerVersion");
    }
    public get installerDownloadUrl(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("installerDownloadUrl");
    }
    public get apacheVersion(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("apacheVersion");
    }
    public get apacheDownloadUrl(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("apacheDownloadUrl");
    }
    public get phpVersion(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("phpVersion");
    }
    public get phpDownloadUrl(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("phpDownloadUrl");
    }
    public get trellixMsiVersion(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("trellixMsiVersion");
    }
    public get trellixMsiDownloadUrl(): AbstractControl<string, string> {
        return this.clientVersionsFormGroup.get("trellixMsiDownloadUrl");
    }

    public async ngOnInit(): Promise<void> {
        this.buildItemForm();
    }

    public submitClientVersionsHandler(): void {
        const clientVersionsDto = this.mapFormValuesToDto();

        if (this.clientVersionEntriesAreEqual(clientVersionsDto)) {
            this.closeDialog();
        } else {
            this.updateClientVersionsHandler(clientVersionsDto);
        }
    }

    public closeDialog(): void {
        this.dialogRef.close(false);
    }

    private buildItemForm(): void {
        const c = this.clientVersionsBefore;

        this.clientVersionsFormGroup = new FormGroup<ClientVersionsUpdateForm>({
            installerVersion: new FormControl(
                c.installerVersion,
                Validators.required
            ),
            installerDownloadUrl: new FormControl(
                c.installerDownloadUrl,
                Validators.required
            ),
            apacheVersion: new FormControl(
                c.apacheVersion,
                Validators.required
            ),
            apacheDownloadUrl: new FormControl(
                c.apacheDownloadUrl,
                Validators.required
            ),
            phpVersion: new FormControl(c.phpVersion, Validators.required),
            phpDownloadUrl: new FormControl(
                c.phpDownloadUrl,
                Validators.required
            ),
            trellixMsiVersion: new FormControl(
                c.trellixMsiVersion,
                Validators.required
            ),
            trellixMsiDownloadUrl: new FormControl(
                c.trellixMsiDownloadUrl,
                Validators.required
            ),
        });
    }

    private mapFormValuesToDto(): ClientVersionAddDto {
        return {
            installerVersion:
                this.clientVersionsFormGroup.controls.installerVersion.value,
            installerDownloadUrl:
                this.clientVersionsFormGroup.controls.installerDownloadUrl
                    .value,
            apacheVersion:
                this.clientVersionsFormGroup.controls.apacheVersion.value,
            apacheDownloadUrl:
                this.clientVersionsFormGroup.controls.apacheDownloadUrl.value,
            phpVersion: this.clientVersionsFormGroup.controls.phpVersion.value,
            phpDownloadUrl:
                this.clientVersionsFormGroup.controls.phpDownloadUrl.value,
            trellixMsiVersion:
                this.clientVersionsFormGroup.controls.trellixMsiVersion.value,
            trellixMsiDownloadUrl:
                this.clientVersionsFormGroup.controls.trellixMsiDownloadUrl
                    .value,
        };
    }

    private clientVersionEntriesAreEqual(
        clientVersionsDto: ClientVersionAddDto
    ): boolean {
        return (
            this.clientVersionsBefore.installerVersion ===
                clientVersionsDto.installerVersion &&
            this.clientVersionsBefore.installerDownloadUrl ===
                clientVersionsDto.installerDownloadUrl &&
            this.clientVersionsBefore.apacheVersion ===
                clientVersionsDto.apacheVersion &&
            this.clientVersionsBefore.apacheDownloadUrl ===
                clientVersionsDto.apacheDownloadUrl &&
            this.clientVersionsBefore.phpVersion ===
                clientVersionsDto.phpVersion &&
            this.clientVersionsBefore.phpDownloadUrl ===
                clientVersionsDto.phpDownloadUrl &&
            this.clientVersionsBefore.trellixMsiVersion ===
                clientVersionsDto.trellixMsiVersion &&
            this.clientVersionsBefore.trellixMsiDownloadUrl ===
                clientVersionsDto.trellixMsiDownloadUrl
        );
    }

    private async updateClientVersionsHandler(
        clientVersionsDto: ClientVersionAddDto
    ): Promise<void> {
        this.isLoading = true;
        this.clientVersionsFormGroup.disable();

        await this.clientVersionsService
            .addClientVersions(clientVersionsDto)
            .then((response) => {
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
        this.clientVersionsFormGroup.enable();
    }
}
