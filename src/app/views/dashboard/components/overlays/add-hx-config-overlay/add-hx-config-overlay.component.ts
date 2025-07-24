import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
    Validators,
    FormGroup,
    FormControl,
    AbstractControl,
} from "@angular/forms";
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";
import {
    HxConfig,
    HxConfigAddDto,
    HxConfigUpdateDto,
    HxCredentials,
} from "../../../../management/models";
import { HxConfigService } from "app/views/management/services/hx-config.service";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { AppConfirmService } from "app/shared/services/app-confirm/app-confirm.service";

interface HxConfigAddForm {
    hxServerName: FormControl<string>;
    hxServerUrl: FormControl<string>;
    hxConfigJson: FormControl<string>;
    hxApiUrl: FormControl<string>;
    hxApiUser: FormControl<string>;
    hxApiPass: FormControl<string>;
    isDefault: FormControl<boolean>;
}

@Component({
    selector: "app-views-management-hx-config-add-overlay",
    templateUrl: "./add-hx-config-overlay.component.html",
    styleUrls: ["./add-hx-config-overlay.component.scss"],
})
export class AddHxConfigOverlayComponent implements OnInit {
    public static readonly ACCEPTED_FILE_EXTENSIONS = [".json"];

    public AddHxConfigOverlayComponent = AddHxConfigOverlayComponent;

    public hxConfigFormGroup: FormGroup<HxConfigAddForm>;
    public isLoading: boolean;
    public hasProcessedJsonFile: boolean;

    private hxConfigs: HxConfig[];

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: HxConfig[],
        private readonly dialogRef: MatDialogRef<AddHxConfigOverlayComponent>,
        private readonly confirmService: AppConfirmService,
        private readonly errorService: AppErrorService,
        private readonly hxConfigService: HxConfigService
    ) {
        this.isLoading = false;
        this.hasProcessedJsonFile = false;
        this.hxConfigs = this.data;
    }

    public get hxServerName(): AbstractControl<string, string> {
        return this.hxConfigFormGroup.get("hxServerName");
    }
    public get hxServerUrl(): AbstractControl<string, string> {
        return this.hxConfigFormGroup.get("hxServerUrl");
    }
    public get hxConfigJson(): AbstractControl<string, string> {
        return this.hxConfigFormGroup.get("hxConfigJson");
    }
    public get hxApiUrl(): AbstractControl<string, string> {
        return this.hxConfigFormGroup.get("hxApiUrl");
    }
    public get hxApiUser(): AbstractControl<string, string> {
        return this.hxConfigFormGroup.get("hxApiUser");
    }
    public get hxApiPass(): AbstractControl<string, string> {
        return this.hxConfigFormGroup.get("hxApiPass");
    }
    public get isDefault(): AbstractControl<boolean, boolean> {
        return this.hxConfigFormGroup.get("isDefault");
    }

    public async ngOnInit(): Promise<void> {
        this.buildItemForm();
    }

    public onFileInput(fileList: FileList): void {
        if (fileList?.length <= 0) return;

        this.readJsonFile(fileList.item(0));
    }

    public isDefaultToggleChangeHandler(event: MatSlideToggleChange): void {
        if (event.checked && this.defaultAlreadyExists()) {
            this.confirmService
                .show({
                    title: "Default HX Server already defined!",
                    message:
                        "There is already a default HX server defined. Do you want to make this config the new default?",
                })
                .subscribe((accepted) => {
                    if (!accepted) {
                        this.hxConfigFormGroup.controls.isDefault.setValue(
                            false
                        );
                    }
                });
        }
    }

    public async submitHxConfigHandler(): Promise<void> {
        if (this.hxConfigFormGroup.valid) {
            const hxServerUrl = this.hxConfigFormGroup.get("hxServerUrl").value;
            const hxApiUrl = this.hxConfigFormGroup.get("hxApiUrl").value;
            const sanitizedHxServerUrl =
                this.removeTrailingSlashWhitespaceAndProtocolFromUrl(
                    hxServerUrl
                );
            const sanitizedHxApiUrl = `https://${this.removeTrailingSlashWhitespaceAndProtocolFromUrl(
                hxApiUrl
            )}`;

            this.hxConfigFormGroup.controls.hxServerUrl.setValue(
                sanitizedHxServerUrl
            );
            this.hxConfigFormGroup.controls.hxApiUrl.setValue(
                sanitizedHxApiUrl
            );

            await this.createHxConfigHandler(
                this.hxConfigFormGroup.value as HxConfigAddDto
            );
        }
    }

    public closeDialog(): void {
        this.dialogRef.close(false);
    }

    private removeTrailingSlashWhitespaceAndProtocolFromUrl(
        url: string
    ): string {
        return url
            .trim()
            .replace(/\/$|\/(?=\?)|\/(?=#)/g, "")
            .replace(/^https?:\/\//, "");
    }

    private buildItemForm(): void {
        this.hxConfigFormGroup = new FormGroup<HxConfigAddForm>({
            hxServerName: new FormControl("", Validators.required),
            hxServerUrl: new FormControl("", Validators.required),
            hxApiUrl: new FormControl("", Validators.required),
            hxApiUser: new FormControl("", Validators.required),
            hxApiPass: new FormControl("", Validators.required),
            hxConfigJson: new FormControl("", Validators.required),
            isDefault: new FormControl(false),
        });
    }

    private readJsonFile(jsonFile: File): void {
        const fileReader = new FileReader();
        fileReader.addEventListener("load", (fr) => {
            const parsedJson = JSON.parse(fr.target.result.toString());
            this.hxConfigFormGroup.controls.hxConfigJson.setValue(
                JSON.stringify(parsedJson)
            );
            this.hasProcessedJsonFile = true;
        });
        fileReader.addEventListener("error", (e) => {
            console.error(
                "An error occured while trying to read the json file"
            );
        });
        fileReader.readAsText(jsonFile);
    }

    private async createHxConfigHandler(
        hxConfigDto: HxConfigAddDto
    ): Promise<void> {
        this.isLoading = true;
        this.hxConfigFormGroup.disable();

        const hxCredentials: HxCredentials = {
            hxApiUrl: hxConfigDto.hxApiUrl,
            hxApiUser: hxConfigDto.hxApiUser,
            hxApiPass: hxConfigDto.hxApiPass,
        };
        const hasValidConnection =
            await this.checkHxApiConnectionWithGivenCredentials(hxCredentials);
        if (!hasValidConnection) {
            return this.showErrorModal(
                "Wrong HX API credentials",
                "Either the HX API url, user or password is incorrect, or the HX server is not reachable at the moment. Please update and try again."
            );
        }

        if (hxConfigDto.isDefault) {
            const updateResult = await this.updateFormerDefaultHxConfig();
            if (!updateResult) {
                return this.showErrorModal(
                    "Update HX Config",
                    "Unable to update former default HX Server configuration for unknown reasons. Please avoid setting the new configuration as default."
                );
            }
        }

        await this.createNewHxConfig(hxConfigDto);
    }

    private async checkHxApiConnectionWithGivenCredentials(
        hxCredentials: HxCredentials
    ): Promise<boolean> {
        return await this.hxConfigService
            .checkHxApiHealth(hxCredentials)
            .then((r) => {
                return r.statusCode > 201 ? false : true;
            })
            .catch(() => {
                return false;
            });
    }

    private async updateFormerDefaultHxConfig(): Promise<boolean> {
        const currentDefault = this.hxConfigs.filter((h) => h.isDefault);

        if (currentDefault.length) {
            const hxConfigUpdateDto: HxConfigUpdateDto = currentDefault[0];
            hxConfigUpdateDto.isDefault = false;

            return await this.hxConfigService
                .updateHxConfig(hxConfigUpdateDto)
                .then((r) => {
                    return r.statusCode > 201 ? false : true;
                })
                .catch(() => {
                    return false;
                });
        }

        return true;
    }

    private async createNewHxConfig(
        hxConfigDto: HxConfigAddDto
    ): Promise<void> {
        await this.hxConfigService
            .createHxConfig(hxConfigDto)
            .then((r) => {
                if (r.statusCode > 201) {
                    return this.showErrorModal(r.statusCode, r.message);
                }

                this.isLoading = false;
                this.dialogRef.close(true);
            })
            .catch((reason) => {
                this.showErrorModal(
                    reason.error.statusCode,
                    reason.error.message
                );
            });
    }

    private defaultAlreadyExists(): boolean {
        return this.hxConfigs.filter((n) => n.isDefault).length > 0;
    }

    private showErrorModal(title: string | number, message: string): void {
        this.errorService.show({
            title: `Error - ${title.toString()}`,
            message: message,
        });
        this.isLoading = false;
        this.hxConfigFormGroup.enable();
    }
}
