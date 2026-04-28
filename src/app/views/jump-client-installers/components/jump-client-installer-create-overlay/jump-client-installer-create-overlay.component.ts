import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Observable, of, Subject, firstValueFrom } from "rxjs";
import { map, startWith, takeUntil } from "rxjs/operators";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { SessionPoliciesService } from "../../../session-policies/session-policies.service";
import { JumpGroup } from "../../../jump-groups/models";
import { JumpPolicy } from "../../../jump-policies/models";
import { SessionPolicy } from "../../../session-policies/models";
import { CreateJumpClientInstallerDtoInput } from "../../models";
import { JumpClientConnectionType, JumpClientGroupType } from "../../enums";
import { CustomerCacheService } from "../../../customers/customer-cache.service";
import { CustomerBusinessUnit } from "../../../customers/enums";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../../../shared/helpers/pra-data-filter";

export interface JumpClientInstallerCreateDialogData {
    /** The tenant ID of the selected BeyondTrust instance. */
    tenantId: number;
}

interface JumpClientInstallerCreateForm {
    name: FormControl<string>;
    tag: FormControl<string>;
    jumpGroup: FormControl<JumpGroup | null>;
    jumpPolicy: FormControl<JumpPolicy | null>;
    sessionPolicy: FormControl<SessionPolicy | null>;
}

@Component({
    selector: "app-jump-client-installer-create-overlay",
    templateUrl: "./jump-client-installer-create-overlay.component.html",
})
export class JumpClientInstallerCreateOverlayComponent
    implements OnInit, OnDestroy
{
    private readonly destroy$ = new Subject<void>();

    public isLoading = false;
    public loadError: string | null = null;
    public jumpGroups: JumpGroup[] = [];
    public jumpPolicies: JumpPolicy[] = [];
    public sessionPolicies: SessionPolicy[] = [];
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public filteredJumpPolicies$: Observable<JumpPolicy[]> = of([]);
    public filteredSessionPolicies$: Observable<SessionPolicy[]> = of([]);
    public form!: FormGroup<JumpClientInstallerCreateForm>;

    constructor(
        public dialogRef: MatDialogRef<JumpClientInstallerCreateOverlayComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: JumpClientInstallerCreateDialogData,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly sessionPoliciesService: SessionPoliciesService,
        private readonly customerCacheService: CustomerCacheService,
        private readonly jwtAuthService: JwtAuthService,
    ) {}

    public ngOnInit(): void {
        this.initForm();
        this.loadData();
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Initialize the reactive form with default / empty values & validators */
    private initForm(): void {
        this.form = new FormGroup<JumpClientInstallerCreateForm>({
            name: new FormControl<string>("", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            tag: new FormControl<string>("", { nonNullable: true }),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
            ]),
            jumpPolicy: new FormControl<JumpPolicy | null>(null),
            sessionPolicy: new FormControl<SessionPolicy | null>(null),
        });
    }

    /** Load all required data and apply BU-based filtering for non-SuperAdmins */
    private async loadData(): Promise<void> {
        this.isLoading = true;
        this.loadError = null;

        const tenantId = this.data.tenantId;
        const user = await firstValueFrom(this.jwtAuthService.praUser);
        const businessUnit = user?.businessUnit;

        // Optionally load customers for BU-based filtering of jump groups / policies
        const customersPromise = businessUnit
            ? this.customerCacheService.fetchCustomers({
                  businessUnits: [
                      businessUnit as unknown as CustomerBusinessUnit,
                  ],
              })
            : Promise.resolve([]);

        Promise.all([
            this.jumpGroupsService.fetchJumpGroups(tenantId),
            this.jumpPoliciesService.fetchJumpPolicies(tenantId),
            this.sessionPoliciesService.fetchSessionPolicies(tenantId),
            customersPromise,
        ])
            .then(([jumpGroups, jumpPolicies, sessionPolicies, customers]) => {
                if (businessUnit) {
                    // BU Admin — apply filtering
                    const customerNames = customers.map((c) => c.name);

                    this.jumpGroups = PraDataFilter.filterByCustomerPrefix(
                        jumpGroups,
                        customerNames,
                        (g) => g.name,
                    );
                    this.jumpPolicies = PraDataFilter.filterByCustomerPrefix(
                        jumpPolicies,
                        customerNames,
                        (p) => p.codeName,
                    );
                    // Session policies are filtered by BU code directly via codeName
                    this.sessionPolicies = PraDataFilter.filterByBusinessUnit(
                        sessionPolicies,
                        businessUnit,
                        [(p) => p.codeName],
                    );
                } else {
                    // SuperAdmin — no filtering
                    this.jumpGroups = jumpGroups;
                    this.jumpPolicies = jumpPolicies;
                    this.sessionPolicies = sessionPolicies;
                }

                this.setupAutocompleteFilters();
                this.isLoading = false;
            })
            .catch((error) => {
                console.error(
                    "Failed to load jump client installer data:",
                    error,
                );
                this.loadError =
                    "Failed to load required data. Please try again.";
                this.isLoading = false;
            });
    }

    /** Setup autocomplete filter streams */
    private setupAutocompleteFilters(): void {
        const jumpGroupControl = this.form.controls.jumpGroup;
        const jumpPolicyControl = this.form.controls.jumpPolicy;
        const sessionPolicyControl = this.form.controls.sessionPolicy;

        this.filteredJumpGroups$ = jumpGroupControl.valueChanges.pipe(
            startWith(jumpGroupControl.value),
            map((value) => this.filterItems(value, this.jumpGroups, "name")),
            takeUntil(this.destroy$),
        );

        this.filteredJumpPolicies$ = jumpPolicyControl.valueChanges.pipe(
            startWith(jumpPolicyControl.value),
            map((value) =>
                this.filterItems(value, this.jumpPolicies, "displayName"),
            ),
            takeUntil(this.destroy$),
        );

        this.filteredSessionPolicies$ = sessionPolicyControl.valueChanges.pipe(
            startWith(sessionPolicyControl.value),
            map((value) =>
                this.filterItems(value, this.sessionPolicies, "displayName"),
            ),
            takeUntil(this.destroy$),
        );
    }

    /** Generic filter function to reduce duplication */
    private filterItems<T>(
        value: string | T | null,
        items: T[],
        propertyName: keyof T,
    ): T[] {
        const filterValue =
            typeof value === "string"
                ? value.toLowerCase()
                : value
                  ? String(value[propertyName]).toLowerCase()
                  : "";

        return items.filter((item) =>
            String(item[propertyName]).toLowerCase().includes(filterValue),
        );
    }

    /** Close without result */
    public cancel(): void {
        this.dialogRef.close(null);
    }

    /** Submit form and return create request */
    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();
        const trimmedTag = formValue.tag.trim();

        const request: CreateJumpClientInstallerDtoInput = {
            // User-provided fields (form values — never overridden by defaults)
            name: formValue.name.trim(),
            tag: trimmedTag || undefined,
            jumpGroupId: formValue.jumpGroup!.id,
            jumpGroupType: JumpClientGroupType.Shared,
            jumpPolicyId: formValue.jumpPolicy?.id ?? undefined,
            sessionPolicyId: formValue.sessionPolicy?.id ?? null,
            // Defaults aligned with site-import-workflow.ts (fields not exposed in the form)
            connectionType: JumpClientConnectionType.Active,
            validDurationInMinutes: 20160, // 14 days
            shouldElevateInstall: true,
            shouldElevatePrompt: true,
            canOverrideJumpGroup: false,
            canOverrideJumpPolicy: false,
            canOverrideName: false,
            canOverrideTag: false,
            canOverrideComments: false,
            canOverrideSessionPolicy: false,
        };

        this.dialogRef.close(request);
    }

    /** Display function for Jump Group autocomplete */
    public displayJumpGroup = (jumpGroup: JumpGroup | null): string => {
        return jumpGroup?.name ?? "";
    };

    /** Display function for Jump Policy autocomplete */
    public displayJumpPolicy = (jumpPolicy: JumpPolicy | null): string => {
        return jumpPolicy?.displayName ?? "— No Jump Policy —";
    };

    /** Display function for Session Policy autocomplete */
    public displaySessionPolicy = (
        sessionPolicy: SessionPolicy | null,
    ): string => {
        return sessionPolicy?.displayName ?? "— No Session Policy —";
    };
}
