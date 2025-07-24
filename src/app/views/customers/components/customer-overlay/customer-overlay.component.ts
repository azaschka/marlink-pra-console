import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { CustomersService } from "../../customers.service";
import {
    Customer,
    CustomerCreateRequest,
    CustomerModifyRequest,
} from "../../models";
import { CustomerBillingType, CustomerBusinessUnit } from "../../enums";

export type CustomerOverlayMode = "add" | "edit";
export interface CustomerOverlayDialogData {
    mode: CustomerOverlayMode;
    customer?: Customer;
}

@Component({
    selector: "app-customer-overlay",
    templateUrl: "./customer-overlay.component.html",
})
export class CustomerOverlayComponent implements OnInit {
    public isLoading = false;
    public mode: CustomerOverlayMode;
    public customer?: Customer;

    public businessUnits = [
        { value: "MT", label: "Maritime" },
        { value: "OA", label: "Omniacces" },
        { value: "DI", label: "Diverto" },
        { value: "EG", label: "EEG" },
        { value: "TE", label: "Telemar" },
    ];
    public billingTypes = [
        { value: "user", label: "User-based" },
        { value: "asset", label: "Asset-based" },
    ];

    public customerFormGroup = new FormGroup({
        key: new FormControl({ value: "", disabled: false }, [
            Validators.required,
        ]),
        name: new FormControl({ value: "", disabled: false }, [
            Validators.required,
        ]),
        businessUnit: new FormControl("", [Validators.required]),
        billingType: new FormControl("", [Validators.required]),
    });

    constructor(
        public dialogRef: MatDialogRef<CustomerOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CustomerOverlayDialogData,
        private readonly customerService: CustomersService,
        private readonly errorDialog: ErrorDialogService
    ) {
        this.mode = data.mode;
        this.customer = data.customer;
    }

    public ngOnInit(): void {
        if (this.mode === "edit" && this.customer) {
            this.customerFormGroup.patchValue({
                key: this.customer.key,
                name: this.customer.name,
                billingType: this.customer.billingType,
            });
            this.customerFormGroup.get("key")?.disable();
            this.customerFormGroup.get("name")?.disable();
            this.customerFormGroup.get("businessUnit")?.disable();
        }
    }

    public close(): void {
        this.dialogRef.close(false);
    }

    public async submitHandler(): Promise<void> {
        if (this.customerFormGroup.invalid) return;
        this.isLoading = true;
        this.customerFormGroup.disable();

        try {
            if (this.mode === "add") {
                await this.createCustomer();
            } else {
                await this.modifyCustomer();
            }
            this.dialogRef.close(true);
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "An unknown error occurred.",
            });
            this.customerFormGroup.enable();
        } finally {
            this.isLoading = false;
        }
    }

    private async createCustomer(): Promise<void> {
        const form = this.customerFormGroup.value;
        const body: CustomerCreateRequest = {
            key: form.key.trim(),
            name: form.name.trim(),
            businessUnit: form.businessUnit as CustomerBusinessUnit,
            billingType: form.billingType as CustomerBillingType,
        };
        await this.customerService.createCustomer(body);
    }

    private async modifyCustomer(): Promise<void> {
        if (!this.customer) return;
        const form = this.customerFormGroup.value;
        const body: CustomerModifyRequest = {
            billingType: form.billingType as CustomerBillingType,
        };
        await this.customerService.modifyCustomer(this.customer.id, body);
    }

    get key() {
        return this.customerFormGroup.get("key");
    }
    get name() {
        return this.customerFormGroup.get("name");
    }
    get businessUnit() {
        return this.customerFormGroup.get("businessUnit");
    }
    get billingType() {
        return this.customerFormGroup.get("billingType");
    }
}
