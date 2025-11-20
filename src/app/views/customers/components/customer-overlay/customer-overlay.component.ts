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
import { CustomerBusinessUnit } from "../../enums";
import { AppService } from "../../../../app.service";
import { BeyondtrustInstance } from "../../../dashboard/components/beyondtrust-instaces/models";

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
    public beyondtrustInstances: BeyondtrustInstance[] = [];

    public businessUnits = [
        { value: "MT", label: "Maritime" },
        { value: "OA", label: "Omniaccess" },
        { value: "MC", label: "Marlink Cyber" },
        { value: "EG", label: "EEG" },
        { value: "TE", label: "Telemar" },
    ];

    public customerFormGroup = new FormGroup({
        key: new FormControl({ value: "", disabled: false }, [
            Validators.required,
        ]),
        name: new FormControl({ value: "", disabled: false }, [
            Validators.required,
        ]),
        businessUnit: new FormControl("", [Validators.required]),
        beyondtrustInstanceId: new FormControl<number | null>(null, [
            Validators.required,
        ]),
    });

    constructor(
        public dialogRef: MatDialogRef<CustomerOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CustomerOverlayDialogData,
        private readonly customerService: CustomersService,
        private readonly errorDialog: ErrorDialogService,
        private readonly appService: AppService
    ) {
        this.mode = data.mode;
        this.customer = data.customer;
    }

    public async ngOnInit(): Promise<void> {
        // Initialize AppService and load BeyondTrust instances
        await this.appService.initialize();
        this.beyondtrustInstances = this.appService.getInstances();

        if (this.mode === "edit" && this.customer) {
            this.customerFormGroup.patchValue({
                key: this.customer.key,
                name: this.customer.name,
                beyondtrustInstanceId: this.customer.beyondtrustInstanceId,
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
            key: form.key!.trim(),
            name: form.name!.trim(),
            businessUnit: form.businessUnit as CustomerBusinessUnit,
            beyondtrustInstanceId: form.beyondtrustInstanceId!,
        };
        await this.customerService.createCustomer(body);
    }

    private async modifyCustomer(): Promise<void> {
        if (!this.customer) return;
        const form = this.customerFormGroup.value;
        const body: CustomerModifyRequest = {
            beyondtrustInstanceId: form.beyondtrustInstanceId!,
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
    get beyondtrustInstanceId() {
        return this.customerFormGroup.get("beyondtrustInstanceId");
    }
}
