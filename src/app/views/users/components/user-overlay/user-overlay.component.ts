import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
    FormGroup,
    FormControl,
    Validators,
    AbstractControl,
} from "@angular/forms";
import { map, Observable, of, startWith, Subject, takeUntil } from "rxjs";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { GroupPoliciesService } from "../../../group-policies/group-policies.service";
import { UsersService } from "../../users.service";
import { User, UserCreateRequest, UserUpdateRequest } from "../../models";
import { GroupPolicy } from "app/views/group-policies/models";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { CustomerCacheService } from "../../../customers/customer-cache.service";
import { AuthRole } from "../../../../shared/enums/auth-role.enum";
import { CustomerBusinessUnit } from "../../../customers/enums";

export type UserOverlayMode = "add" | "edit";

export interface UserOverlayDialogData {
    mode: UserOverlayMode;
    tenantId: number;
    user?: User;
}

interface UserFormValue {
    publicDisplayName: string;
    username: string;
    email: string;
    regeneratePassword: boolean;
}

/**
 * Component for adding or editing users
 * Handles form validation, group policy assignment, and user management
 */
@Component({
    selector: "app-user-overlay",
    templateUrl: "./user-overlay.component.html",
})
export class UserOverlayComponent implements OnInit, OnDestroy {
    private static readonly SPECIAL_GROUP_POLICIES: string[] = [
        "GP_FULL_ACCESS",
        "FULL_ACCESS",
        "GP_LIMITED_ACCESS",
        "LIMITED_ACCESS",
        "GP_MARLINK_OPERATORS",
        "MARLINK_OPERATORS",
    ];

    public isLoading = false;

    public readonly mode: UserOverlayMode;
    public readonly user?: User;

    // Group policies state
    public allGroupPolicies: GroupPolicy[] = [];
    public selectedGroupPolicies: GroupPolicy[] = [];
    public groupPolicyInputCtrl = new FormControl<string>("");
    public filteredGroupPolicies$: Observable<GroupPolicy[]> = of([]);

    public readonly userFormGroup: FormGroup;

    private initialGroupPolicies: GroupPolicy[] = [];
    private readonly destroy$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<UserOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: UserOverlayDialogData,
        private readonly usersService: UsersService,
        private readonly errorDialog: ErrorDialogService,
        private readonly groupPoliciesService: GroupPoliciesService,
        private readonly jwtAuthService: JwtAuthService,
        private readonly customerCacheService: CustomerCacheService,
    ) {
        this.mode = data.mode;
        this.user = data.user;
        this.userFormGroup = this.createForm();
    }

    public async ngOnInit(): Promise<void> {
        await this.loadOverlayData();
        this.setupGroupPolicyAutocomplete();
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Creates the reactive form with all controls and validators
     */
    private createForm(): FormGroup {
        return new FormGroup({
            publicDisplayName: new FormControl<string>("", [
                Validators.required,
            ]),
            username: new FormControl<string>("", [Validators.required]),
            email: new FormControl<string>("", [
                Validators.required,
                Validators.email,
            ]),
            regeneratePassword: new FormControl<boolean>(false),
        });
    }

    /**
     * Loads initial data for the overlay (group policies and user data in edit mode)
     */
    private async loadOverlayData(): Promise<void> {
        this.isLoading = true;
        this.userFormGroup.disable();

        try {
            await this.loadGroupPolicies();

            if (this.mode === "edit" && this.user) {
                await this.loadUserData();
            }
        } catch (err) {
            this.handleLoadError(err);
        } finally {
            this.isLoading = false;
            this.userFormGroup.enable();
        }
    }

    /**
     * Loads all available group policies.
     * For non-Super-Admin users with a Business Unit, filters policies to those
     * matching BU customers, special global policies, or BU-prefixed policies.
     */
    private async loadGroupPolicies(): Promise<void> {
        const allPolicies = await this.groupPoliciesService.fetchGroupPolicies(
            this.data.tenantId,
        );

        const praUser = this.jwtAuthService.getPraUser();

        if (praUser.role === AuthRole.SUPER_ADMIN || !praUser.businessUnit) {
            this.allGroupPolicies = allPolicies;
            return;
        }

        const businessUnit =
            praUser.businessUnit as unknown as CustomerBusinessUnit;
        const customers = await this.customerCacheService.fetchCustomers({
            businessUnits: [businessUnit],
        });
        const customerNames = customers.map((c) => c.name.toLowerCase());
        const specialPolicies = new Set(
            UserOverlayComponent.SPECIAL_GROUP_POLICIES,
        );

        this.allGroupPolicies = allPolicies.filter((policy) => {
            const upperName = policy.name.toUpperCase();

            if (specialPolicies.has(upperName)) {
                return true;
            }

            if (policy.name.startsWith(`${praUser.businessUnit}_`)) {
                return true;
            }

            const lowerName = policy.name.toLowerCase();
            return customerNames.some((customerName) =>
                lowerName.includes(customerName),
            );
        });
    }

    /**
     * Loads user data and assigned group policies in edit mode
     */
    private async loadUserData(): Promise<void> {
        if (!this.user) {
            return;
        }

        const userGroupPolicies =
            await this.usersService.fetchUserGroupPolicies(
                this.data.tenantId,
                this.user.id,
            );

        this.selectedGroupPolicies = userGroupPolicies.map(
            (ugp) => ugp.groupPolicy,
        );
        this.initialGroupPolicies = [...this.selectedGroupPolicies];

        this.userFormGroup.patchValue({
            publicDisplayName: this.user.publicDisplayName,
            username: this.user.username,
            email: this.user.email,
        });
    }

    /**
     * Sets up the group policy autocomplete filtering
     */
    private setupGroupPolicyAutocomplete(): void {
        this.filteredGroupPolicies$ =
            this.groupPolicyInputCtrl.valueChanges.pipe(
                startWith(""),
                map((value) => this.filterGroupPolicies(value || "")),
                takeUntil(this.destroy$),
            );
    }

    /**
     * Filters group policies based on search value and excludes already selected policies
     */
    private filterGroupPolicies(value: string | GroupPolicy): GroupPolicy[] {
        const filterValue = this.extractFilterValue(value);

        return this.allGroupPolicies.filter(
            (policy) =>
                policy.name.toLowerCase().includes(filterValue) &&
                !this.isGroupPolicySelected(policy),
        );
    }

    /**
     * Extracts the filter string from the autocomplete value
     */
    private extractFilterValue(value: string | GroupPolicy): string {
        if (typeof value === "string") {
            return value.toLowerCase();
        }

        if (value && typeof value === "object" && "name" in value) {
            return value.name.toLowerCase();
        }

        return "";
    }

    /**
     * Checks if a group policy is already selected
     */
    private isGroupPolicySelected(policy: GroupPolicy): boolean {
        return this.selectedGroupPolicies.some((sel) => sel.id === policy.id);
    }

    /**
     * Adds a group policy to the selected list
     */
    public addGroupPolicy(policy: GroupPolicy): void {
        if (!this.isGroupPolicySelected(policy)) {
            this.selectedGroupPolicies.push(policy);
        }
        this.groupPolicyInputCtrl.setValue("");
    }

    /**
     * Removes a group policy from the selected list
     */
    public removeGroupPolicy(policy: GroupPolicy): void {
        this.selectedGroupPolicies = this.selectedGroupPolicies.filter(
            (sel) => sel.id !== policy.id,
        );
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
        if (this.userFormGroup.invalid) {
            return;
        }

        this.isLoading = true;
        this.userFormGroup.disable();

        try {
            if (this.mode === "add") {
                await this.createUserWithPolicies();
            } else {
                await this.updateUserWithPolicies();
            }

            this.dialogRef.close(true);
        } catch (err) {
            this.handleSubmitError(err);
            this.userFormGroup.enable();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Creates a new user and assigns selected group policies
     */
    private async createUserWithPolicies(): Promise<void> {
        const formValue = this.userFormGroup.value as UserFormValue;

        const request: UserCreateRequest = {
            publicDisplayName: formValue.publicDisplayName.trim(),
            username: formValue.username.trim(),
            email: formValue.email.trim(),
            isTwoFactorAuthRequired: true,
            mustResetPasswordOnNextLogin: true,
        };

        const createdUser = await this.usersService.createUser(
            this.data.tenantId,
            request,
        );

        await this.assignGroupPolicies(createdUser.id);
    }

    /**
     * Updates an existing user and manages group policy changes
     */
    private async updateUserWithPolicies(): Promise<void> {
        if (!this.user) {
            throw new Error("User data missing for edit operation");
        }

        const formValue = this.userFormGroup.value as UserFormValue;

        const request: UserUpdateRequest = {
            publicDisplayName: formValue.publicDisplayName.trim(),
            username: formValue.username.trim(),
            email: formValue.email.trim(),
            regeneratePassword: formValue.regeneratePassword || false,
        };

        await this.usersService.updateUser(
            this.data.tenantId,
            this.user.id,
            request,
        );

        await this.updateGroupPolicyAssignments(this.user.id);
    }

    /**
     * Assigns selected group policies to a newly created user
     */
    private async assignGroupPolicies(userId: number): Promise<void> {
        const groupPolicyIds = this.selectedGroupPolicies.map(
            (policy) => policy.id,
        );

        if (groupPolicyIds.length > 0) {
            await this.usersService.updateUserGroupPolicies(
                this.data.tenantId,
                userId,
                groupPolicyIds,
                [],
            );
        }
    }

    /**
     * Updates group policy assignments for an existing user
     */
    private async updateGroupPolicyAssignments(userId: number): Promise<void> {
        const { toAdd, toRemove } = this.calculateGroupPolicyChanges();

        if (toAdd.length > 0 || toRemove.length > 0) {
            await this.usersService.updateUserGroupPolicies(
                this.data.tenantId,
                userId,
                toAdd,
                toRemove,
            );
        }
    }

    /**
     * Calculates which group policies need to be added or removed
     */
    private calculateGroupPolicyChanges(): {
        toAdd: number[];
        toRemove: number[];
    } {
        const initialIds = new Set(
            this.initialGroupPolicies.map((gp) => gp.id),
        );
        const currentIds = new Set(
            this.selectedGroupPolicies.map((gp) => gp.id),
        );

        const toAdd = [...currentIds].filter((id) => !initialIds.has(id));
        const toRemove = [...initialIds].filter((id) => !currentIds.has(id));

        return { toAdd, toRemove };
    }

    /**
     * Handles errors during data loading
     */
    private handleLoadError(err: unknown): void {
        const message =
            err instanceof Error
                ? err.message
                : "Could not load group policies or user data.";

        this.errorDialog.show({
            title: "Error",
            message,
        });
    }

    /**
     * Handles errors during form submission
     */
    private handleSubmitError(err: unknown): void {
        const message =
            err instanceof Error
                ? err.message
                : "An unknown error occurred while saving the user.";

        this.errorDialog.show({
            title: "Error",
            message,
        });
    }

    // Template convenience getters
    get publicDisplayName(): AbstractControl | null {
        return this.userFormGroup.get("publicDisplayName");
    }

    get username(): AbstractControl | null {
        return this.userFormGroup.get("username");
    }

    get email(): AbstractControl | null {
        return this.userFormGroup.get("email");
    }
}
