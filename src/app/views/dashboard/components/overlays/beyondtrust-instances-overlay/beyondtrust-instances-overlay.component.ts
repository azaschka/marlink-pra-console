import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ErrorDialogService } from "app/shared/dialogs/error-dialog/error-dialog.service";
import { BeyondtrustInstancesService } from "../../beyondtrust-instaces/beyondtrust-instances.service";
import {
    BeyondtrustInstance,
    CreateBeyondtrustInstanceDto,
    ModifyBeyondtrustInstanceDto,
} from "../../beyondtrust-instaces/models";
import { BillingType } from "../../beyondtrust-instaces/enums";
import { BusinessUnit, BusinessUnitLabels } from "app/views/pra-users/enums";
import { JwtAuthService } from "app/shared/services/auth/jwt-auth.service";
import { AuthRole } from "app/shared/enums";

export type BeyondtrustInstanceOverlayMode = "add" | "edit";
export interface BeyondtrustInstanceOverlayDialogData {
    mode: BeyondtrustInstanceOverlayMode;
    instance?: BeyondtrustInstance;
}

@Component({
    selector: "app-beyondtrust-instances-overlay",
    templateUrl: "./beyondtrust-instances-overlay.component.html",
})
export class BeyondtrustInstancesOverlayComponent implements OnInit {
    public isLoading = false;
    public mode: BeyondtrustInstanceOverlayMode;
    public instance?: BeyondtrustInstance;
    public hidePassword = true;

    public billingTypes = [
        { value: BillingType.User, label: "User" },
        { value: BillingType.Asset, label: "Asset" },
    ];

    public businessUnitOptions: {
        value: BusinessUnit | null;
        label: string;
    }[] = [
        { value: null, label: "Shared" },
        ...Object.entries(BusinessUnitLabels).map(([value, label]) => ({
            value: value as BusinessUnit,
            label,
        })),
    ];

    public instanceFormGroup = new FormGroup({
        name: new FormControl("", [Validators.required]),
        authClientId: new FormControl("", [Validators.required]),
        authClientSecret: new FormControl("", [Validators.required]),
        oauth2TokenUrl: new FormControl("", [Validators.required]),
        apiBaseUrl: new FormControl("", [Validators.required]),
        billingType: new FormControl<BillingType>(BillingType.User, [
            Validators.required,
        ]),
        businessUnit: new FormControl<BusinessUnit | null>(null),
    });

    constructor(
        public dialogRef: MatDialogRef<BeyondtrustInstancesOverlayComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: BeyondtrustInstanceOverlayDialogData,
        private readonly beyondtrustInstancesService: BeyondtrustInstancesService,
        private readonly errorDialog: ErrorDialogService,
        private readonly jwtAuthService: JwtAuthService,
    ) {
        this.mode = data.mode;
        this.instance = data.instance;
    }

    public ngOnInit(): void {
        if (this.mode === "edit" && this.instance) {
            this.instanceFormGroup.patchValue({
                name: this.instance.name,
                authClientId: this.instance.authClientId,
                authClientSecret: this.instance.authClientSecret,
                oauth2TokenUrl: this.instance.oauth2TokenUrl,
                apiBaseUrl: this.instance.apiBaseUrl,
                billingType: this.instance.billingType,
                businessUnit: this.instance.businessUnit,
            });
        }

        const user = this.jwtAuthService.getPraUser();
        if (user && user.role !== AuthRole.SUPER_ADMIN) {
            this.instanceFormGroup
                .get("businessUnit")!
                .setValue(user.businessUnit ?? null);
            this.instanceFormGroup.get("businessUnit")!.disable();
        }
    }

    public close(): void {
        this.dialogRef.close(false);
    }

    public async submitHandler(): Promise<void> {
        if (this.instanceFormGroup.invalid) return;
        this.isLoading = true;
        this.instanceFormGroup.disable();

        try {
            if (this.mode === "add") {
                await this.createInstance();
            } else {
                await this.updateInstance();
            }
            this.dialogRef.close(true);
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "An unknown error occurred.",
            });
            this.instanceFormGroup.enable();
        } finally {
            this.isLoading = false;
        }
    }

    private async createInstance(): Promise<void> {
        const form = this.instanceFormGroup.getRawValue();
        const body: CreateBeyondtrustInstanceDto = {
            name: form.name!.trim(),
            authClientId: form.authClientId!.trim(),
            authClientSecret: form.authClientSecret!.trim(),
            oauth2TokenUrl: form.oauth2TokenUrl!.trim(),
            apiBaseUrl: form.apiBaseUrl!.trim(),
            billingType: form.billingType!,
            businessUnit: form.businessUnit ?? null,
        };
        await this.beyondtrustInstancesService.create(body);
    }

    private async updateInstance(): Promise<void> {
        if (!this.instance) return;
        const form = this.instanceFormGroup.getRawValue();
        const body: ModifyBeyondtrustInstanceDto = {
            name: form.name!.trim(),
            authClientId: form.authClientId!.trim(),
            authClientSecret: form.authClientSecret!.trim(),
            oauth2TokenUrl: form.oauth2TokenUrl!.trim(),
            apiBaseUrl: form.apiBaseUrl!.trim(),
            billingType: form.billingType!,
            businessUnit: form.businessUnit ?? null,
        };
        await this.beyondtrustInstancesService.update(this.instance.id, body);
    }

    get name() {
        return this.instanceFormGroup.get("name");
    }
    get authClientId() {
        return this.instanceFormGroup.get("authClientId");
    }
    get authClientSecret() {
        return this.instanceFormGroup.get("authClientSecret");
    }
    get oauth2TokenUrl() {
        return this.instanceFormGroup.get("oauth2TokenUrl");
    }
    get apiBaseUrl() {
        return this.instanceFormGroup.get("apiBaseUrl");
    }
    get billingType() {
        return this.instanceFormGroup.get("billingType");
    }
    get businessUnit() {
        return this.instanceFormGroup.get("businessUnit");
    }
}
