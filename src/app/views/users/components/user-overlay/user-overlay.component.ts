import { Component, Inject, Input, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { map, Observable, of, startWith } from "rxjs";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { CustomValidators } from "../../../../shared/helpers";
import { GroupPoliciesService } from "../../../group-policies/group-policies.service";
import { UsersService } from "../../users.service";
import { User, UserCreateRequest, UserUpdateRequest } from "../../models";
import { GroupPolicy } from "app/views/group-policies/models";

export type UserOverlayMode = "add" | "edit";

interface UserForm {
    publicDisplayName: FormControl<string>;
    username: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    retypePassword: FormControl<string>;
    groupPolicyInput: FormControl<string>;
}

export interface UserOverlayDialogData {
    mode: UserOverlayMode;
    user?: User;
}

@Component({
    selector: "app-user-overlay",
    templateUrl: "./user-overlay.component.html",
})
export class UserOverlayComponent implements OnInit {
    public static readonly MIN_PASSWORD_LENGTH = 6;

    public UserOverlayComponent = UserOverlayComponent;

    public isLoading = false;
    public hidePassword = true;
    public hideRetypePassword = true;

    public mode: UserOverlayMode;
    public user?: User;

    // Group policies states
    public allGroupPolicies: GroupPolicy[] = [];
    public selectedGroupPolicies: GroupPolicy[] = [];
    private initialGroupPolicies: GroupPolicy[] = [];
    public groupPolicyInputCtrl = new FormControl<string>("");
    public filteredGroupPolicies$: Observable<GroupPolicy[]> = of([]);

    public userFormGroup = new FormGroup<UserForm>(
        {
            publicDisplayName: new FormControl("", [Validators.required]),
            username: new FormControl("", [Validators.required]),
            email: new FormControl("", [Validators.required, Validators.email]),
            password: new FormControl("", []), // Validators only in "add"
            retypePassword: new FormControl("", []),
            groupPolicyInput: this.groupPolicyInputCtrl,
        },
        {
            validators: CustomValidators.passwordsMatch(
                "password",
                "retypePassword"
            ),
        }
    );

    constructor(
        public dialogRef: MatDialogRef<UserOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: UserOverlayDialogData,
        private readonly usersService: UsersService,
        private readonly errorDialog: ErrorDialogService,
        private readonly groupPoliciesService: GroupPoliciesService
    ) {
        this.mode = data.mode;
        this.user = data.user;
    }

    public async ngOnInit(): Promise<void> {
        await this.loadOverlayData();
    }

    public close(): void {
        this.dialogRef.close(false);
    }

    public addGroupPolicy(policy: GroupPolicy): void {
        if (!this.selectedGroupPolicies.find((sel) => sel.id === policy.id)) {
            this.selectedGroupPolicies.push(policy);
        }
        this.groupPolicyInputCtrl.setValue("");
    }

    public removeGroupPolicy(policy: GroupPolicy): void {
        this.selectedGroupPolicies = this.selectedGroupPolicies.filter(
            (sel) => sel.id !== policy.id
        );
    }

    public async submitHandler(): Promise<void> {
        if (this.userFormGroup.invalid) return;
        this.isLoading = true;
        this.userFormGroup.disable();

        try {
            if (this.mode === "add") {
                await this.createUserAndAssignPolicies();
            } else {
                await this.updateUserAndPolicies();
            }
            this.dialogRef.close(true);
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message: err?.message ?? "An unknown error occurred.",
            });
            this.userFormGroup.enable();
        } finally {
            this.isLoading = false;
        }
    }

    private async loadOverlayData(): Promise<void> {
        this.isLoading = true;
        this.userFormGroup.disable();

        try {
            // Load group policies (needed in both modes)
            this.allGroupPolicies =
                await this.groupPoliciesService.fetchGroupPolicies();

            if (this.mode === "edit" && this.user) {
                // Fetch user group policies and pre-fill form
                const userGroupPolicies =
                    await this.usersService.fetchUserGroupPolicies(
                        this.user.id
                    );
                this.selectedGroupPolicies = userGroupPolicies.map(
                    (ugp) => ugp.groupPolicy
                );
                this.initialGroupPolicies = [...this.selectedGroupPolicies];

                // Pre-fill form
                this.userFormGroup.patchValue({
                    publicDisplayName: this.user.publicDisplayName,
                    username: this.user.username,
                    email: this.user.email,
                });
            }

            if (this.mode === "add") {
                // In add mode, ensure validators for password fields
                this.password?.setValidators([
                    Validators.required,
                    Validators.minLength(
                        UserOverlayComponent.MIN_PASSWORD_LENGTH
                    ),
                ]);
                this.retypePassword?.setValidators([Validators.required]);
            } else {
                // In edit mode, password is optional, so only minlength if entered
                this.password?.setValidators([
                    Validators.minLength(
                        UserOverlayComponent.MIN_PASSWORD_LENGTH
                    ),
                ]);
                this.retypePassword?.setValidators([]);
            }

            this.password?.updateValueAndValidity();
            this.retypePassword?.updateValueAndValidity();

            // Setup group policy autocomplete
            this.filteredGroupPolicies$ =
                this.groupPolicyInputCtrl.valueChanges.pipe(
                    startWith(""),
                    map((value) => this.filterGroupPolicies(value || ""))
                );
        } catch (err) {
            this.errorDialog.show({
                title: "Error",
                message: "Could not load group policies or user data.",
            });
        } finally {
            this.isLoading = false;
            this.userFormGroup.enable();
        }
    }

    /** Handles user creation and initial group policy assignment */
    private async createUserAndAssignPolicies(): Promise<void> {
        const form = this.userFormGroup.value;
        const user: UserCreateRequest = {
            publicDisplayName: form.publicDisplayName!.trim(),
            username: form.username!.trim(),
            password: form.password!.trim(),
            email: form.email!.trim(),
            preferredEmailLanguage: "en-us",
            isTwoFactorAuthRequired: true,
            failedLoginAttempts: 0,
            mustResetPasswordOnNextLogin: true,
        };
        const createdUser = await this.usersService.createUser(user);

        // Assign policies if selected
        const groupPolicyIds = this.selectedGroupPolicies.map(
            (policy) => policy.id
        );
        if (groupPolicyIds.length > 0) {
            await this.usersService.updateUserGroupPolicies(
                createdUser.id,
                groupPolicyIds,
                []
            );
        }
    }

    /** Handles user update and assignment/removal of group policies */
    private async updateUserAndPolicies(): Promise<void> {
        const form = this.userFormGroup.value;
        const body: UserUpdateRequest = {
            publicDisplayName: form.publicDisplayName!.trim(),
            username: form.username!.trim(),
            email: form.email!.trim(),
        };

        // Only send password if set and valid
        if (
            form.password &&
            form.password.length >= UserOverlayComponent.MIN_PASSWORD_LENGTH
        ) {
            body.password = form.password;
        }

        if (!this.user) throw new Error("User missing for edit.");
        await this.usersService.updateUser(this.user.id, body);

        // Compare policies
        const initialIds = new Set(
            this.initialGroupPolicies.map((gp) => gp.id)
        );
        const currentIds = new Set(
            this.selectedGroupPolicies.map((gp) => gp.id)
        );
        const toAdd = [...currentIds].filter((id) => !initialIds.has(id));
        const toRemove = [...initialIds].filter((id) => !currentIds.has(id));

        if (toAdd.length > 0 || toRemove.length > 0) {
            await this.usersService.updateUserGroupPolicies(
                this.user.id,
                toAdd,
                toRemove
            );
        }
    }

    private filterGroupPolicies(value: string | GroupPolicy): GroupPolicy[] {
        let filterValue: string = "";
        if (typeof value === "string") {
            filterValue = value.toLowerCase();
        } else if (value && typeof value === "object" && "name" in value) {
            filterValue = value.name.toLowerCase();
        }

        return this.allGroupPolicies.filter(
            (policy) =>
                policy.name.toLowerCase().includes(filterValue) &&
                !this.selectedGroupPolicies.some((sel) => sel.id === policy.id)
        );
    }

    // Getters for template binding
    get publicDisplayName() {
        return this.userFormGroup.get("publicDisplayName");
    }
    get username() {
        return this.userFormGroup.get("username");
    }
    get email() {
        return this.userFormGroup.get("email");
    }
    get password() {
        return this.userFormGroup.get("password");
    }
    get retypePassword() {
        return this.userFormGroup.get("retypePassword");
    }
    get passwordsMismatch() {
        return this.userFormGroup.hasError("passwordsMismatch");
    }
}
