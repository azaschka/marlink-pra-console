import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators, AbstractControl } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraUsersService } from "../../pra-users.service";
import { PraUser, PraUserCreateRequest, PraUserUpdateRequest } from "../../models";
import { BusinessUnit, BusinessUnitLabels, UserRole } from "../../enums";
import { PraUser as AuthPraUser } from "../../../../shared/models";
import { PraUserDefaults } from "../../../../shared/config";

export type PraUserOverlayMode = "add" | "edit";

export interface PraUserOverlayDialogData {
    mode: PraUserOverlayMode;
    user?: PraUser;
}

interface PraUserFormValue {
    displayName: string;
    username: string;
    email: string;
    role: UserRole;
    businessUnit: BusinessUnit | null;
    regeneratePassword: boolean;
    canManagePraUsers: boolean;
}

/**
 * Component for adding or editing PRA users
 * Handles form validation, business unit logic based on role, and permission management
 */
@Component({
    selector: "app-pra-user-overlay",
    templateUrl: "./pra-user-overlay.component.html",
})
export class PraUserOverlayComponent implements OnInit, OnDestroy {

    public isLoading = false;

    public readonly mode: PraUserOverlayMode;
    public readonly user?: PraUser;
    public readonly currentUser: AuthPraUser;

    public readonly businessUnits = Object.values(BusinessUnit);
    public readonly businessUnitLabels = BusinessUnitLabels;

    public readonly form: FormGroup;

    private readonly destroy$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<PraUserOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PraUserOverlayDialogData,
        private readonly praUsersService: PraUsersService,
        private readonly errorDialog: ErrorDialogService,
        private readonly jwtAuthService: JwtAuthService,
    ) {
        this.mode = data.mode;
        this.user = data.user;
        this.currentUser = this.jwtAuthService.getPraUser();
        this.form = this.createForm();
    }

    public ngOnInit(): void {
        this.initializeFormValues();
        this.setupRoleBasedLogic();
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Returns available user roles based on current user's permissions
     * Admin users cannot assign SuperAdmin role
     */
    public get availableUserRoles(): UserRole[] {
        const allRoles = Object.values(UserRole);

        // Admin users cannot assign SuperAdmin role
        if (this.currentUser?.role === "Admin") {
            return allRoles.filter((role) => role !== UserRole.SuperAdmin);
        }

        return allRoles;
    }

    /**
     * Creates the reactive form with all controls and validators
     */
    private createForm(): FormGroup {
        return new FormGroup({
            displayName: new FormControl<string>("", [Validators.required]),
            username: new FormControl<string>("", [Validators.required]),
            email: new FormControl<string>("", [Validators.required, Validators.email]),
            role: new FormControl<UserRole>(UserRole.Admin, [Validators.required]),
            businessUnit: new FormControl<BusinessUnit | null>(null, []),
            regeneratePassword: new FormControl<boolean>(false),
            canManagePraUsers: new FormControl<boolean>(false),
        });
    }

    /**
     * Sets initial form values in edit mode
     */
    private initializeFormValues(): void {
        if (this.mode === "edit" && this.user) {
            this.form.patchValue({
                displayName: this.user.displayName,
                username: this.user.username,
                email: this.user.email,
                role: this.user.role,
                businessUnit: this.user.businessUnit ?? null,
                canManagePraUsers: this.user.canManagePraUsers ?? false,
            });
        }
    }

    /**
     * Sets up reactive logic for business unit and canManagePraUsers fields based on user role
     */
    private setupRoleBasedLogic(): void {
        const roleControl = this.form.controls["role"];
        const currentRole = roleControl.value as UserRole;

        // Set initial state
        this.updateRoleBasedFields(currentRole);

        // React to role changes
        roleControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((role: UserRole) => {
            this.updateRoleBasedFields(role);
        });
    }

    /**
     * Updates business unit and canManagePraUsers field states based on role
     */
    private updateRoleBasedFields(role: UserRole): void {
        this.updateBusinessUnitField(role);
        this.updateCanManagePraUsersField(role);
    }

    /**
     * Returns true when the currently logged-in user is an Admin (any Admin,
     * regardless of the `canManagePraUsers` flag).
     *
     * Admins are always restricted to their own business unit when creating
     * or editing users.  This prevents a BU Admin from:
     *  - assigning a user to a different business unit, or
     *  - promoting an existing user out of their own BU.
     *
     * SuperAdmins (who are not restricted) return false here and can freely
     * set any business unit.
     */
    private isRestrictedAdmin(): boolean {
        return this.currentUser?.role === "Admin";
    }

    /**
     * Updates business unit field state (enabled/disabled, validators) based on role
     */
    private updateBusinessUnitField(role: UserRole): void {
        const businessUnitControl = this.form.controls["businessUnit"];

        if (role === UserRole.SuperAdmin || role === UserRole.DataCenterEngineer) {
            // Super Admin and Data Center Engineer don't need business unit
            businessUnitControl.disable({ emitEvent: false });
            businessUnitControl.setValue(null, { emitEvent: false });
            businessUnitControl.clearValidators();
        } else if (role === UserRole.Admin) {
            // Admin requires business unit
            businessUnitControl.setValidators([Validators.required]);

            // Set default value if empty
            if (!businessUnitControl.value) {
                const defaultValue = this.getDefaultBusinessUnit();
                businessUnitControl.setValue(defaultValue, {
                    emitEvent: false,
                });
            }

            // Restrict business unit selection for Admin users with canManagePraUsers
            if (this.isRestrictedAdmin()) {
                // Lock to current user's business unit
                businessUnitControl.setValue(this.currentUser.businessUnit, {
                    emitEvent: false,
                });
                businessUnitControl.disable({ emitEvent: false });
            } else {
                businessUnitControl.enable({ emitEvent: false });
            }
        } else {
            // Other roles: optional business unit
            businessUnitControl.clearValidators();
            businessUnitControl.enable({ emitEvent: false });
        }

        businessUnitControl.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * Updates canManagePraUsers field state based on role
     * Only Admin users can have this permission
     */
    private updateCanManagePraUsersField(role: UserRole): void {
        const canManagePraUsersControl = this.form.controls["canManagePraUsers"];

        if (role === UserRole.Admin) {
            // Only Admin can manage PRA users
            canManagePraUsersControl.enable({ emitEvent: false });
        } else {
            // Other roles cannot have this permission
            canManagePraUsersControl.disable({ emitEvent: false });
            canManagePraUsersControl.setValue(false, { emitEvent: false });
        }
    }

    /**
     * Gets the default business unit based on context
     */
    private getDefaultBusinessUnit(): BusinessUnit {
        // Restricted admins must use their own business unit
        if (this.isRestrictedAdmin() && this.currentUser.businessUnit) {
            return this.currentUser.businessUnit;
        }

        if (this.mode === "edit" && this.user?.businessUnit) {
            return this.user.businessUnit;
        }
        return PraUserDefaults.defaultAdminBusinessUnit;
    }

    /**
     * Closes the dialog without saving
     */
    public close(): void {
        this.dialogRef.close(false);
    }

    /**
     * Handles form submission
     */
    public async submitHandler(): Promise<void> {
        if (this.form.invalid) {
            return;
        }

        this.isLoading = true;
        this.form.disable();

        try {
            const formValue = this.form.getRawValue() as PraUserFormValue;

            if (this.mode === "add") {
                await this.createUser(formValue);
            } else {
                await this.updateUser(formValue);
            }

            this.dialogRef.close(true);
        } catch (err) {
            this.handleError(err);
            this.form.enable();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Creates a new PRA user
     */
    private async createUser(formValue: PraUserFormValue): Promise<void> {
        const request: PraUserCreateRequest = {
            displayName: formValue.displayName.trim(),
            username: formValue.username.trim(),
            email: formValue.email.trim(),
            role: formValue.role,
            businessUnit: this.getBusinessUnitForRequest(formValue),
            canManagePraUsers: this.getCanManagePraUsersForRequest(formValue),
        };

        await this.praUsersService.createPraUser(request);
    }

    /**
     * Updates an existing PRA user
     */
    private async updateUser(formValue: PraUserFormValue): Promise<void> {
        if (!this.user) {
            throw new Error("User data missing for edit operation");
        }

        const request: PraUserUpdateRequest = {
            displayName: formValue.displayName.trim(),
            username: formValue.username.trim(),
            email: formValue.email.trim(),
            role: formValue.role,
            businessUnit: this.getBusinessUnitForRequest(formValue),
            canManagePraUsers: this.getCanManagePraUsersForRequest(formValue),
            regeneratePassword: formValue.regeneratePassword,
        };

        await this.praUsersService.updatePraUser(this.user.id, request);
    }

    /**
     * Extracts business unit for API request based on role
     */
    private getBusinessUnitForRequest(formValue: PraUserFormValue): BusinessUnit | undefined {
        return formValue.role === UserRole.Admin ? (formValue.businessUnit ?? undefined) : undefined;
    }

    /**
     * Extracts canManagePraUsers for API request based on role
     * Only Admin users can have this permission
     */
    private getCanManagePraUsersForRequest(formValue: PraUserFormValue): boolean | undefined {
        return formValue.role === UserRole.Admin ? formValue.canManagePraUsers : undefined;
    }

    /**
     * Handles errors during form submission
     */
    private handleError(err: unknown): void {
        const message = err instanceof Error ? err.message : "An unknown error occurred while saving the user.";

        this.errorDialog.show({
            title: "Error",
            message,
        });
    }

    // Template convenience getters
    get displayName(): AbstractControl | null {
        return this.form.get("displayName");
    }

    get username(): AbstractControl | null {
        return this.form.get("username");
    }

    get email(): AbstractControl | null {
        return this.form.get("email");
    }

    get role(): AbstractControl | null {
        return this.form.get("role");
    }

    get businessUnit(): AbstractControl | null {
        return this.form.get("businessUnit");
    }

    get canManagePraUsers(): AbstractControl | null {
        return this.form.get("canManagePraUsers");
    }
}
