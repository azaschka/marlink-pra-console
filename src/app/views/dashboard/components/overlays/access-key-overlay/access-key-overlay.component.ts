import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { v4 as uuid } from "uuid";
import { BusinessUnit } from "../../../../../views/pra-users/enums";
import {
    AccessKey,
    CreateAccessKeyDto,
    ModifyAccessKeyDto,
} from "../../access-keys/models";

export interface AccessKeyOverlayData {
    accessKey: AccessKey | null;
}

export type AccessKeyOverlayResult =
    | { type: "create"; dto: CreateAccessKeyDto }
    | { type: "update"; id: number; dto: ModifyAccessKeyDto }
    | null;

@Component({
    selector: "app-access-key-overlay",
    templateUrl: "access-key-overlay.component.html",
})
export class AccessKeyOverlayComponent implements OnInit {
    public form!: FormGroup;
    public isLoading = false;
    public businessUnits = Object.values(BusinessUnit);
    public businessUnitLabels: Record<BusinessUnit, string> = {
        [BusinessUnit.MT]: "Maritime",
        [BusinessUnit.OA]: "Omniaccess",
        [BusinessUnit.MC]: "Marlink Cyber",
        [BusinessUnit.EG]: "EEG",
        [BusinessUnit.TE]: "Telemar",
    };

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AccessKeyOverlayData,
        private readonly dialogRef: MatDialogRef<AccessKeyOverlayComponent>,
        private readonly formBuilder: FormBuilder
    ) {}

    public ngOnInit(): void {
        this.initForm();

        // Generate initial key for new access keys
        if (!this.isEditMode) {
            this.regenerateKey();
        }
    }

    private initForm(): void {
        this.form = this.formBuilder.group({
            key: [
                this.data.accessKey?.key || "",
                [Validators.required, Validators.minLength(3)],
            ],
            name: [
                this.data.accessKey?.name || "",
                [Validators.required, Validators.minLength(3)],
            ],
            businessUnits: [
                this.data.accessKey?.value.businessUnits || [],
                [Validators.required, Validators.minLength(1)],
            ],
        });
    }

    public regenerateKey(): void {
        const newKey = uuid();
        this.form.patchValue({ key: newKey });
    }

    public get isEditMode(): boolean {
        return this.data.accessKey !== null;
    }

    public get dialogTitle(): string {
        return this.isEditMode ? "Edit Access Key" : "Add Access Key";
    }

    public submitHandler(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.form.disable();

        const result: AccessKeyOverlayResult = this.isEditMode
            ? {
                  type: "update",
                  id: this.data.accessKey!.id,
                  dto: {
                      key: this.form.value.key!.trim(),
                      name: this.form.value.name!.trim(),
                      value: {
                          businessUnits: this.form.value.businessUnits!,
                      },
                  },
              }
            : {
                  type: "create",
                  dto: {
                      key: this.form.value.key!.trim(),
                      name: this.form.value.name!.trim(),
                      value: {
                          businessUnits: this.form.value.businessUnits!,
                      },
                  },
              };

        this.dialogRef.close(result);
    }

    public close(): void {
        this.dialogRef.close(null);
    }

    get key() {
        return this.form.get("key");
    }

    get name() {
        return this.form.get("name");
    }

    get businessUnitsControl() {
        return this.form.get("businessUnits");
    }
}
