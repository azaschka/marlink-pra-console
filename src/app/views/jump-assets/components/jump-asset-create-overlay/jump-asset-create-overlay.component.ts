import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Observable, of, Subject, firstValueFrom } from "rxjs";
import { map, startWith, takeUntil } from "rxjs/operators";
import { StringSanitizer } from "../../../../shared/helpers";
import { Jumpoint } from "../../../jumpoints/models";
import { JumpointsService } from "../../../jumpoints/jumpoints.service";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { JumpGroup } from "../../../jump-groups/models";
import { JumpPolicy } from "../../../jump-policies/models";
import { JumpAssetCreateRequest } from "../../models";
import { CustomersService } from "../../../customers/customers.service";
import { CustomerBusinessUnit } from "../../../customers/enums";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../../../shared/helpers/pra-data-filter";

export type JumpAssetType =
    | "remoteRdp"
    | "protocolTunnel"
    | "remoteVnc"
    | "shellJump"
    | "webJump"
    | "jumpClient";

export interface JumpAssetCreateDialogData {
    /** Determines which form fields / validators to show. */
    assetType: JumpAssetType;
    /** The tenant ID of the selected BeyondTrust instance. */
    tenantId: number;
}

interface JumpAssetForm {
    name: FormControl<string>;
    tag: FormControl<string>;
    hostname: FormControl<string>;
    port: FormControl<number | null>;
    jumpoint: FormControl<Jumpoint | null>;
    jumpGroup: FormControl<JumpGroup | null>;
    jumpPolicy: FormControl<JumpPolicy | null>;
    mustVerifyCertificate: FormControl<boolean>;
}

@Component({
    selector: "app-jump-asset-create-overlay",
    templateUrl: "./jump-asset-create-overlay.component.html",
})
export class JumpAssetCreateOverlayComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_REMOTE_VNC_PORT = 5900;
    private static readonly DEFAULT_SHELL_JUMP_PORT = 22;
    private static readonly MIN_PORT = 1;
    private static readonly MAX_PORT = 65535;
    private static readonly DEFAULT_JUMP_GROUP_TYPE = "shared";

    private readonly destroy$ = new Subject<void>();

    public isLoading = false;
    public loadError: string | null = null;
    public jumpoints: Jumpoint[] = [];
    public jumpGroups: JumpGroup[] = [];
    public jumpPolicies: JumpPolicy[] = [];
    public filteredJumpoints$: Observable<Jumpoint[]> = of([]);
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public filteredJumpPolicies$: Observable<JumpPolicy[]> = of([]);
    public form!: FormGroup<JumpAssetForm>;

    private readonly assetTypeNames: Record<JumpAssetType, string> = {
        remoteRdp: "Remote RDP",
        shellJump: "Shell Jump",
        webJump: "Web Jump",
        remoteVnc: "Remote VNC",
        protocolTunnel: "Protocol Tunnel",
        jumpClient: "Jump Client",
    };

    constructor(
        public dialogRef: MatDialogRef<JumpAssetCreateOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: JumpAssetCreateDialogData,
        private readonly jumpointsService: JumpointsService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly customersService: CustomersService,
        private readonly jwtAuthService: JwtAuthService,
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Initialize the reactive form with default / empty values & validators */
    private initForm(): void {
        this.form = new FormGroup<JumpAssetForm>({
            name: new FormControl<string>("", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            tag: new FormControl<string>("", { nonNullable: true }),
            hostname: new FormControl<string>("", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            port: new FormControl<number | null>(null),
            jumpoint: new FormControl<Jumpoint | null>(null, [
                Validators.required,
            ]),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
            ]),
            jumpPolicy: new FormControl<JumpPolicy | null>(null),
            mustVerifyCertificate: new FormControl<boolean>(false, {
                nonNullable: true,
            }),
        });

        this.setDynamicValidators();
    }

    /** Load all required data and apply BU-based filtering for non-SuperAdmins */
    private async loadData(): Promise<void> {
        this.isLoading = true;
        this.loadError = null;

        const tenantId = this.data.tenantId;
        const user = await firstValueFrom(this.jwtAuthService.praUser);
        const businessUnit = user?.businessUnit;

        // Build the array of observables — always load the three core lists
        const sources: [
            Promise<Jumpoint[]>,
            Promise<JumpGroup[]>,
            Promise<JumpPolicy[]>,
        ] = [
            this.jumpointsService.fetchJumpoints(tenantId),
            this.jumpGroupsService.fetchJumpGroups(tenantId),
            this.jumpPoliciesService.fetchJumpPolicies(tenantId),
        ];

        // If the user has a BU (i.e. is a BU Admin), also load customers for
        // that BU so we can filter JumpGroups and JumpPolicies by customer prefix.
        const customersPromise = businessUnit
            ? this.customersService.fetchCustomers({
                  businessUnits: [
                      businessUnit as unknown as CustomerBusinessUnit,
                  ],
                  pageSize: 9999,
              })
            : Promise.resolve([]);

        Promise.all([...sources, customersPromise])
            .then(([jumpoints, jumpGroups, jumpPolicies, customers]) => {
                if (businessUnit) {
                    // BU Admin — apply filtering
                    const customerNames = customers.map((c) => c.name);

                    this.jumpoints = PraDataFilter.filterByBusinessUnit(
                        jumpoints,
                        businessUnit,
                        [(j) => j.codeName],
                    );
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
                } else {
                    // SuperAdmin — no filtering
                    this.jumpoints = jumpoints;
                    this.jumpGroups = jumpGroups;
                    this.jumpPolicies = jumpPolicies;
                }

                this.setupAutocompleteFilters();
                this.isLoading = false;
            })
            .catch((error) => {
                console.error("Failed to load jump asset data:", error);
                this.loadError =
                    "Failed to load required data. Please try again.";
                this.isLoading = false;
            });
    }

    /** Setup autocomplete filter streams */
    private setupAutocompleteFilters(): void {
        const jumpointControl = this.form.controls.jumpoint;
        const jumpGroupControl = this.form.controls.jumpGroup;
        const jumpPolicyControl = this.form.controls.jumpPolicy;

        this.filteredJumpoints$ = jumpointControl.valueChanges.pipe(
            startWith(jumpointControl.value),
            map((value) => this.filterItems(value, this.jumpoints, "name")),
            takeUntil(this.destroy$),
        );

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

    /** Set validators & defaults depending on asset type */
    private setDynamicValidators(): void {
        const portCtrl = this.form.controls.port;

        if (this.showPortField()) {
            portCtrl.setValidators([
                Validators.required,
                Validators.min(JumpAssetCreateOverlayComponent.MIN_PORT),
                Validators.max(JumpAssetCreateOverlayComponent.MAX_PORT),
            ]);
            portCtrl.setValue(this.getDefaultPort());
        } else {
            portCtrl.clearValidators();
            portCtrl.setValue(null);
        }

        if (!this.showMustVerifyCertificate()) {
            this.form.controls.mustVerifyCertificate.setValue(false);
        }

        portCtrl.updateValueAndValidity();
    }

    /** Get default port based on asset type */
    private getDefaultPort(): number {
        return this.data.assetType === "remoteVnc"
            ? JumpAssetCreateOverlayComponent.DEFAULT_REMOTE_VNC_PORT
            : JumpAssetCreateOverlayComponent.DEFAULT_SHELL_JUMP_PORT;
    }

    /** Determines if the Port field should be visible */
    public showPortField(): boolean {
        return (
            this.data.assetType === "shellJump" ||
            this.data.assetType === "remoteVnc"
        );
    }

    /** Determines if "Verify Certificate" toggle should be visible */
    public showMustVerifyCertificate(): boolean {
        return this.data.assetType === "webJump";
    }

    /** Get human-readable asset type name */
    public getAssetTypeName(): string {
        return this.assetTypeNames[this.data.assetType] || "Jump Asset";
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

        const request: JumpAssetCreateRequest = {
            name: formValue.name.trim(),
            tag: this.sanitizeString(formValue.tag),
            hostname:
                this.data.assetType !== "webJump"
                    ? formValue.hostname.trim()
                    : undefined,
            url:
                this.data.assetType === "webJump"
                    ? formValue.hostname.trim()
                    : undefined,
            port: this.showPortField() ? formValue.port! : undefined,
            jumpointId: formValue.jumpoint!.id,
            jumpGroupId: formValue.jumpGroup!.id,
            jumpGroupType:
                JumpAssetCreateOverlayComponent.DEFAULT_JUMP_GROUP_TYPE,
            jumpPolicyId: formValue.jumpPolicy?.id ?? null,
            mustVerifyCertificate: this.showMustVerifyCertificate()
                ? formValue.mustVerifyCertificate
                : undefined,
        };

        this.dialogRef.close(request);
    }

    /** Display function for Jumpoint autocomplete */
    public displayJumpoint = (jumpoint: Jumpoint | null): string => {
        return jumpoint?.name ?? "";
    };

    /** Display function for Jump Group autocomplete */
    public displayJumpGroup = (jumpGroup: JumpGroup | null): string => {
        return jumpGroup?.name ?? "";
    };

    /** Display function for Jump Policy autocomplete */
    public displayJumpPolicy = (jumpPolicy: JumpPolicy | null): string => {
        return jumpPolicy?.displayName ?? "— No Jump Policy —";
    };

    /** Replace whitespace with underscores, remove special chars, uppercase */
    private sanitizeString(value: string): string {
        let s = StringSanitizer.replaceWhitespaceWithUnderscore(value);
        s = StringSanitizer.replaceSpecialCharacters(s);
        s = StringSanitizer.removeSpecialCharacters(s);
        return s.toUpperCase();
    }
}
