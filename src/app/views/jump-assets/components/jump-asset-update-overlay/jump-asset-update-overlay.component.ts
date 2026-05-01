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
import { JumpAssetUpdateRequest } from "../../models";
import { StringSanitizer } from "app/shared/helpers";
import { AutocompleteValidators } from "../../../../shared/validators";
import { CustomerCacheService } from "../../../customers/customer-cache.service";
import { CustomerBusinessUnit } from "../../../customers/enums";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../../../shared/helpers/pra-data-filter";

export interface JumpAssetUpdateDialogData {
    assetType:
        | "remoteRdp"
        | "protocolTunnel"
        | "remoteVnc"
        | "shellJump"
        | "webJump"
        | "jumpClient";
    assetId: number;
    currentName: string;
    currentTag: string;
    currentHostname?: string;
    currentPort?: number;
    currentJumpGroupId: number;
    currentJumpGroupType: string;
    currentJumpPolicyId: number | null;
    currentSessionPolicyId?: number | null;
    currentMustVerifyCertificate?: boolean;
    /** The tenant ID of the selected BeyondTrust instance. */
    tenantId: number;
}

interface UpdateForm {
    name: FormControl<string>;
    tag: FormControl<string>;
    hostname: FormControl<string>;
    port: FormControl<number | null>;
    jumpGroup: FormControl<JumpGroup | null>;
    jumpPolicy: FormControl<JumpPolicy | null>;
    sessionPolicy: FormControl<SessionPolicy | null>;
    mustVerifyCertificate: FormControl<boolean>;
}

@Component({
    selector: "app-jump-asset-update-overlay",
    templateUrl: "./jump-asset-update-overlay.component.html",
})
export class JumpAssetUpdateOverlayComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_REMOTE_VNC_PORT = 5900;
    private static readonly DEFAULT_SHELL_JUMP_PORT = 22;
    private static readonly MINIMUM_PORT_NUMBER = 1;
    private static readonly MAXIMUM_PORT_NUMBER = 65535;

    private readonly destroy$ = new Subject<void>();

    private static readonly assetTypeNames: Record<string, string> = {
        remoteRdp: "Remote RDP",
        shellJump: "Shell Jump",
        webJump: "Web Jump",
        remoteVnc: "Remote VNC",
        protocolTunnel: "Protocol Tunnel",
        jumpClient: "Jump Client",
    };

    public isLoading = false;
    public jumpGroups: JumpGroup[] = [];
    public jumpPolicies: JumpPolicy[] = [];
    public sessionPolicies: SessionPolicy[] = [];
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public filteredJumpPolicies$: Observable<JumpPolicy[]> = of([]);
    public filteredSessionPolicies$: Observable<SessionPolicy[]> = of([]);
    public form!: FormGroup<UpdateForm>;

    constructor(
        public dialogRef: MatDialogRef<JumpAssetUpdateOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: JumpAssetUpdateDialogData,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly sessionPoliciesService: SessionPoliciesService,
        private readonly customerCacheService: CustomerCacheService,
        private readonly jwtAuthService: JwtAuthService,
    ) {}

    public ngOnInit(): void {
        this.initForm();
        void this.loadData();
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /** Initialize the reactive form with current values & base validators */
    private initForm(): void {
        this.form = new FormGroup<UpdateForm>({
            name: new FormControl<string>(this.data.currentName, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            tag: new FormControl<string>(this.data.currentTag ?? "", {
                nonNullable: true,
            }),
            hostname: new FormControl<string>(this.data.currentHostname ?? "", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            port: new FormControl<number | null>(this.data.currentPort ?? null),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
                AutocompleteValidators.requireSelection,
            ]),
            jumpPolicy: new FormControl<JumpPolicy | null>(null),
            sessionPolicy: new FormControl<SessionPolicy | null>(null),
            mustVerifyCertificate: new FormControl<boolean>(
                this.data.currentMustVerifyCertificate ?? false,
                { nonNullable: true },
            ),
        });
    }

    /** Load all required data and apply BU-based filtering for non-SuperAdmins */
    private async loadData(): Promise<void> {
        this.isLoading = true;

        try {
            const tenantId = this.data.tenantId;
            const user = await firstValueFrom(this.jwtAuthService.praUser);
            const businessUnit = user?.businessUnit;

            // Optionally load customers for BU-based filtering
            const customersPromise = businessUnit
                ? this.customerCacheService.fetchCustomers({
                      businessUnits: [
                          businessUnit as unknown as CustomerBusinessUnit,
                      ],
                  })
                : Promise.resolve([]);

            const [
                allJumpGroups,
                allJumpPolicies,
                allSessionPolicies,
                customers,
            ] = await Promise.all([
                this.jumpGroupsService.fetchJumpGroups(tenantId),
                this.jumpPoliciesService.fetchJumpPolicies(tenantId),
                this.sessionPoliciesService.fetchSessionPolicies(tenantId),
                customersPromise,
            ]);

            if (businessUnit) {
                // BU Admin — filter jump groups / jump policies by customer prefix,
                // and session policies by BU code directly via codeName
                const customerNames = customers.map((c) => c.name);

                this.jumpGroups = PraDataFilter.filterByCustomerPrefix(
                    allJumpGroups,
                    customerNames,
                    (g) => g.name,
                );
                this.jumpPolicies = PraDataFilter.filterByCustomerPrefix(
                    allJumpPolicies,
                    customerNames,
                    (p) => p.codeName,
                );
                this.sessionPolicies = PraDataFilter.filterByBusinessUnit(
                    allSessionPolicies,
                    businessUnit,
                    [(p) => p.codeName],
                );
            } else {
                // SuperAdmin — no filtering
                this.jumpGroups = allJumpGroups;
                this.jumpPolicies = allJumpPolicies;
                this.sessionPolicies = allSessionPolicies;
            }

            // Pre-select the current values from the filtered lists
            const currentJumpGroup =
                this.jumpGroups.find(
                    (g) => g.id === this.data.currentJumpGroupId,
                ) ?? null;
            const currentJumpPolicy = this.data.currentJumpPolicyId
                ? (this.jumpPolicies.find(
                      (p) => p.id === this.data.currentJumpPolicyId,
                  ) ?? null)
                : null;
            const currentSessionPolicy = this.data.currentSessionPolicyId
                ? (this.sessionPolicies.find(
                      (p) => p.id === this.data.currentSessionPolicyId,
                  ) ?? null)
                : null;

            this.form.patchValue({
                jumpGroup: currentJumpGroup,
                jumpPolicy: currentJumpPolicy,
                sessionPolicy: currentSessionPolicy,
            });

            this.setPortValidators();
            this.setVerifyCertificateValidators();
            this.setupAutocompleteFilters(
                currentJumpGroup,
                currentJumpPolicy,
                currentSessionPolicy,
            );
        } finally {
            this.isLoading = false;
        }
    }

    /** Setup autocomplete filter streams — must be called after data is loaded */
    private setupAutocompleteFilters(
        initialJumpGroup: JumpGroup | null,
        initialJumpPolicy: JumpPolicy | null,
        initialSessionPolicy: SessionPolicy | null,
    ): void {
        const jumpGroupCtrl = this.form.controls.jumpGroup;
        const jumpPolicyCtrl = this.form.controls.jumpPolicy;
        const sessionPolicyCtrl = this.form.controls.sessionPolicy;

        this.filteredJumpGroups$ = jumpGroupCtrl.valueChanges.pipe(
            startWith(initialJumpGroup),
            map((val) => this.filterJumpGroups(val)),
            takeUntil(this.destroy$),
        );

        this.filteredJumpPolicies$ = jumpPolicyCtrl.valueChanges.pipe(
            startWith(initialJumpPolicy),
            map((val) => this.filterJumpPolicies(val)),
            takeUntil(this.destroy$),
        );

        this.filteredSessionPolicies$ = sessionPolicyCtrl.valueChanges.pipe(
            startWith(initialSessionPolicy),
            map((val) => this.filterSessionPolicies(val)),
            takeUntil(this.destroy$),
        );
    }

    public showPortField(): boolean {
        return (
            this.data.assetType === "shellJump" ||
            this.data.assetType === "remoteVnc"
        );
    }

    public showMustVerifyCertificate(): boolean {
        return this.data.assetType === "webJump";
    }

    public getAssetTypeName(): string {
        return (
            JumpAssetUpdateOverlayComponent.assetTypeNames[
                this.data.assetType
            ] ?? "Jump Asset"
        );
    }

    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();

        this.dialogRef.close({
            name: formValue.name.trim(),
            tag: JumpAssetUpdateOverlayComponent.sanitizeString(formValue.tag),
            hostname:
                this.data.assetType !== "webJump"
                    ? formValue.hostname.trim()
                    : undefined,
            url:
                this.data.assetType === "webJump"
                    ? formValue.hostname.trim()
                    : undefined,
            port: this.showPortField() ? formValue.port! : undefined,
            jumpGroupId: formValue.jumpGroup!.id,
            jumpGroupType: "shared",
            jumpPolicyId: formValue.jumpPolicy?.id ?? null,
            sessionPolicyId: formValue.sessionPolicy?.id ?? null,
            mustVerifyCertificate: this.showMustVerifyCertificate()
                ? formValue.mustVerifyCertificate
                : undefined,
        } as JumpAssetUpdateRequest);
    }

    public cancel(): void {
        this.dialogRef.close(null);
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

    private setPortValidators(): void {
        const portCtrl = this.form.controls.port;

        if (this.showPortField()) {
            portCtrl.setValidators([
                Validators.required,
                Validators.min(
                    JumpAssetUpdateOverlayComponent.MINIMUM_PORT_NUMBER,
                ),
                Validators.max(
                    JumpAssetUpdateOverlayComponent.MAXIMUM_PORT_NUMBER,
                ),
            ]);
            if (!portCtrl.value) {
                portCtrl.setValue(
                    this.data.currentPort ??
                        (this.data.assetType === "remoteVnc"
                            ? JumpAssetUpdateOverlayComponent.DEFAULT_REMOTE_VNC_PORT
                            : JumpAssetUpdateOverlayComponent.DEFAULT_SHELL_JUMP_PORT),
                );
            }
        } else {
            portCtrl.clearValidators();
            portCtrl.setValue(null);
        }

        portCtrl.updateValueAndValidity();
    }

    private setVerifyCertificateValidators(): void {
        const certCtrl = this.form.controls.mustVerifyCertificate;

        if (!this.showMustVerifyCertificate()) {
            certCtrl.setValue(false);
            certCtrl.clearValidators();
        }

        certCtrl.updateValueAndValidity();
    }

    private filterJumpGroups(value: string | JumpGroup | null): JumpGroup[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : (value?.name?.toLowerCase() ?? "");

        return this.jumpGroups.filter((g) =>
            g.name.toLowerCase().includes(filter),
        );
    }

    private filterJumpPolicies(
        value: string | JumpPolicy | null,
    ): JumpPolicy[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : (value?.displayName?.toLowerCase() ?? "");

        return this.jumpPolicies.filter((p) =>
            p.displayName.toLowerCase().includes(filter),
        );
    }

    private filterSessionPolicies(
        value: string | SessionPolicy | null,
    ): SessionPolicy[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : (value?.displayName?.toLowerCase() ?? "");

        return this.sessionPolicies.filter((p) =>
            p.displayName.toLowerCase().includes(filter),
        );
    }

    private static sanitizeString(value: string): string {
        let s = StringSanitizer.replaceWhitespaceWithUnderscore(value);
        s = StringSanitizer.replaceSpecialCharacters(s);
        s = StringSanitizer.removeSpecialCharacters(s);
        return s.toUpperCase();
    }
}
