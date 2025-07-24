import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { PraUsersService } from "../../pra-users.service";
import {
    PraUser,
    PraUserCreateRequest,
    PraUserUpdateRequest,
} from "../../models";
import { BusinessUnit, BusinessUnitLabels, UserRole } from "../../enums";

export type PraUserOverlayMode = "add" | "edit";

export interface PraUserOverlayDialogData {
    mode: PraUserOverlayMode;
    user?: PraUser;
}

@Component({
    selector: "app-pra-user-overlay",
    templateUrl: "./pra-user-overlay.component.html",
})
export class PraUserOverlayComponent implements OnInit {
    public static readonly MIN_PASSWORD_LENGTH = 6;

    PraUserOverlayComponent = PraUserOverlayComponent;

    public isLoading = false;
    public hidePassword = true;
    public hideRetypePassword = true;

    public mode: PraUserOverlayMode;
    public user?: PraUser;

    public businessUnits = Object.values(BusinessUnit);
    public businessUnitLabels = BusinessUnitLabels;
    public userRoles = Object.values(UserRole);

    public form = new FormGroup(
        {
            displayName: new FormControl<string>("", [Validators.required]),
            username: new FormControl<string>("", [Validators.required]),
            email: new FormControl<string>("", [
                Validators.required,
                Validators.email,
            ]),
            password: new FormControl<string>("", []), // dynamic validation
            retypePassword: new FormControl<string>("", []),
            role: new FormControl<UserRole>(UserRole.Admin, [
                Validators.required,
            ]),
            businessUnit: new FormControl<BusinessUnit | null>(null, []),
        },
        {
            validators: (fg) => {
                // Password match validator
                const pwd = fg.get("password")?.value;
                const re = fg.get("retypePassword")?.value;
                if (pwd || re) {
                    return pwd === re ? null : { mustMatch: true };
                }
                return null;
            },
        }
    );

    constructor(
        public dialogRef: MatDialogRef<PraUserOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PraUserOverlayDialogData,
        private readonly praUsersService: PraUsersService,
        private readonly errorDialog: ErrorDialogService
    ) {
        this.mode = data.mode;
        this.user = data.user;
    }

    public ngOnInit(): void {
        // Set initial form values for edit mode
        if (this.mode === "edit" && this.user) {
            this.form.patchValue({
                displayName: this.user.displayName,
                username: this.user.username,
                email: this.user.email,
                role: this.user.role,
                businessUnit: this.user.businessUnit ?? null,
            });
        }

        // Set initial password validators
        this.updatePasswordValidators();

        // Set default business unit (add mode, admin)
        if (
            this.mode === "add" &&
            this.form.controls.role.value === UserRole.Admin
        ) {
            this.form.controls.businessUnit.setValue(BusinessUnit.MT, {
                emitEvent: false,
            });
        }

        // Handle business unit field based on role
        this.handleBusinessUnitField(this.form.controls.role.value);

        // React to role changes
        this.form.controls.role.valueChanges.subscribe((role) => {
            this.handleBusinessUnitField(role);
        });

        // In edit mode, if admin but no value -> set MT
        if (
            this.mode === "edit" &&
            this.form.controls.role.value === UserRole.Admin &&
            !this.form.controls.businessUnit.value
        ) {
            this.form.controls.businessUnit.setValue(BusinessUnit.MT, {
                emitEvent: false,
            });
        } else if (this.mode === "edit") {
            // In edit mode, if not admin -> clear business unit
            this.form.controls.businessUnit.setValue(null, {
                emitEvent: false,
            });
        }
    }

    private handleBusinessUnitField(role: UserRole) {
        const buCtrl = this.form.controls.businessUnit;
        if (
            role === UserRole.SuperAdmin ||
            role === UserRole.DataCenterEngineer
        ) {
            buCtrl.disable({ emitEvent: false });
            buCtrl.setValue(null, { emitEvent: false });
            buCtrl.clearValidators();
        } else if (role === UserRole.Admin) {
            buCtrl.enable({ emitEvent: false });
            buCtrl.setValidators([Validators.required]);
            if (!buCtrl.value) {
                buCtrl.setValue(BusinessUnit.MT, { emitEvent: false });
            }
        } else {
            buCtrl.clearValidators();
            buCtrl.enable({ emitEvent: false });
        }
        buCtrl.updateValueAndValidity({ emitEvent: false });
    }

    // Optional: Auslagerung Passwort-Validatoren
    private updatePasswordValidators() {
        if (this.mode === "add") {
            this.form.controls.password.setValidators([
                Validators.required,
                Validators.minLength(
                    PraUserOverlayComponent.MIN_PASSWORD_LENGTH
                ),
            ]);
            this.form.controls.retypePassword.setValidators([
                Validators.required,
            ]);
        } else {
            this.form.controls.password.setValidators([
                Validators.minLength(
                    PraUserOverlayComponent.MIN_PASSWORD_LENGTH
                ),
            ]);
            this.form.controls.retypePassword.setValidators([]);
        }
        this.form.controls.password.updateValueAndValidity();
        this.form.controls.retypePassword.updateValueAndValidity();
    }

    public close(): void {
        this.dialogRef.close(false);
    }

    public async submitHandler(): Promise<void> {
        if (this.form.invalid) return;
        this.isLoading = true;
        const form = this.form.getRawValue(); // alle Werte, auch disabled
        this.form.disable();

        try {
            if (this.mode === "add") {
                const req: PraUserCreateRequest = {
                    displayName: form.displayName!.trim(),
                    username: form.username!.trim(),
                    password: form.password!.trim(),
                    email: form.email!.trim(),
                    role: form.role!,
                    businessUnit:
                        form.role === UserRole.Admin
                            ? form.businessUnit ?? undefined
                            : undefined,
                };
                await this.praUsersService.createPraUser(req);
            } else {
                const req: PraUserUpdateRequest = {
                    displayName: form.displayName!.trim(),
                    username: form.username!.trim(),
                    email: form.email!.trim(),
                    role: form.role!,
                    businessUnit:
                        form.role === UserRole.Admin
                            ? form.businessUnit ?? undefined
                            : undefined,
                };
                if (
                    form.password &&
                    form.password.length >=
                        PraUserOverlayComponent.MIN_PASSWORD_LENGTH
                ) {
                    req.password = form.password;
                }
                if (!this.user) throw new Error("User missing for edit.");
                await this.praUsersService.updatePraUser(this.user.id, req);
            }
            this.dialogRef.close(true);
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "An unknown error occurred.",
            });
            this.form.enable();
        } finally {
            this.isLoading = false;
        }
    }

    // Template convenience getters
    get displayName() {
        return this.form.get("displayName");
    }
    get username() {
        return this.form.get("username");
    }
    get email() {
        return this.form.get("email");
    }
    get password() {
        return this.form.get("password");
    }
    get retypePassword() {
        return this.form.get("retypePassword");
    }
    get role() {
        return this.form.get("role");
    }
    get businessUnit() {
        return this.form.get("businessUnit");
    }
    get mustMatchError() {
        return this.form.hasError("mustMatch");
    }
}
