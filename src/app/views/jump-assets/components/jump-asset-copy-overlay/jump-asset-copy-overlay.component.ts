import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, of, Subject, firstValueFrom } from "rxjs";
import { map, startWith, takeUntil } from "rxjs/operators";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpAssetCopyRequest } from "../../models";
import { JumpGroup } from "../../../jump-groups/models";
import { CustomerCacheService } from "../../../customers/customer-cache.service";
import { CustomerBusinessUnit } from "../../../customers/enums";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../../../shared/helpers/pra-data-filter";
import { BT_JUMP_ITEM_GROUP_TYPE } from "../../../../shared/config";
import { AutocompleteValidators } from "../../../../shared/validators";

export interface CopyJumpAssetDialogData {
    assetType: "remoteRdp" | "shellJump" | "webJump" | "remoteVnc" | "protocolTunnel" | "jumpClient";
    assetId: number;
    defaultName: string;
    /** The tenant ID of the selected BeyondTrust instance. */
    tenantId: number;
}

interface CopyForm {
    name: FormControl<string>;
    jumpGroup: FormControl<JumpGroup | null>;
}

@Component({
    selector: "app-jump-asset-copy-overlay",
    templateUrl: "./jump-asset-copy-overlay.component.html",
})
export class JumpAssetCopyOverlayComponent implements OnInit, OnDestroy {
    private static readonly headlineMap: Record<string, string> = {
        remoteRdp: "Copy Remote RDP",
        shellJump: "Copy Shell Jump",
        webJump: "Copy Web Jump",
        remoteVnc: "Copy Remote VNC",
        protocolTunnel: "Copy Protocol Tunnel",
        jumpClient: "Copy Jump Client",
    };

    private static readonly assetNameMap: Record<string, string> = {
        remoteRdp: "Remote RDP Name",
        shellJump: "Shell Jump Name",
        webJump: "Web Jump Name",
        remoteVnc: "Remote VNC Name",
        protocolTunnel: "Protocol Tunnel Name",
        jumpClient: "Jump Client Name",
    };

    private readonly destroy$ = new Subject<void>();

    public isLoading = false;
    public loadError: string | null = null;
    public jumpGroups: JumpGroup[] = [];
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public form: FormGroup<CopyForm>;

    constructor(
        public dialogRef: MatDialogRef<JumpAssetCopyOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CopyJumpAssetDialogData,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly customerCacheService: CustomerCacheService,
        private readonly jwtAuthService: JwtAuthService,
    ) {
        this.form = new FormGroup<CopyForm>({
            name: new FormControl(`Copy of ${data.defaultName}`, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
                AutocompleteValidators.requireSelection,
            ]),
        });
    }

    public async ngOnInit(): Promise<void> {
        this.isLoading = true;
        this.loadError = null;
        try {
            const tenantId = this.data.tenantId;
            const user = await firstValueFrom(this.jwtAuthService.praUser);
            const businessUnit = user?.businessUnit;

            // Load jump groups and (optionally) customers in parallel
            const [allJumpGroups, customers] = await Promise.all([
                this.jumpGroupsService.fetchJumpGroups(tenantId),
                businessUnit
                    ? this.customerCacheService.fetchCustomers({
                          businessUnits: [businessUnit as unknown as CustomerBusinessUnit],
                      })
                    : Promise.resolve([]),
            ]);

            if (businessUnit) {
                // BU Admin — filter jump groups by customer name prefix
                const customerNames = customers.map((c) => c.name);
                this.jumpGroups = PraDataFilter.filterByCustomerPrefix(allJumpGroups, customerNames, (g) => g.name);
            } else {
                // SuperAdmin — no filtering
                this.jumpGroups = allJumpGroups;
            }

            const jumpGroupCtrl = this.form.controls.jumpGroup;

            this.filteredJumpGroups$ = jumpGroupCtrl.valueChanges.pipe(
                startWith(jumpGroupCtrl.value),
                map((val) => this.filterJumpGroups(val)),
                takeUntil(this.destroy$),
            );
        } catch (error) {
            console.error("[JumpAssetCopyOverlay] Failed to load data:", error);
            this.loadError = "Failed to load required data. Please try again.";
        } finally {
            this.isLoading = false;
        }
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public displayHeadline(): string {
        return JumpAssetCopyOverlayComponent.headlineMap[this.data.assetType] ?? "Copy Jump Asset";
    }

    public displayJumpAssetName(): string {
        return JumpAssetCopyOverlayComponent.assetNameMap[this.data.assetType] ?? "Name";
    }

    /** Arrow function ensures correct `this` context when used as [displayWith] */
    public displayJumpGroup = (jumpGroup: JumpGroup | null): string => {
        return jumpGroup?.name ?? "";
    };

    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();
        const request: JumpAssetCopyRequest = {
            name: formValue.name.trim(),
            jumpGroupId: formValue.jumpGroup!.id,
            jumpGroupType: BT_JUMP_ITEM_GROUP_TYPE,
        };
        this.dialogRef.close(request);
    }

    public cancel(): void {
        this.dialogRef.close(null);
    }

    private filterJumpGroups(value: string | JumpGroup | null): JumpGroup[] {
        const filter = typeof value === "string" ? value.toLowerCase() : (value?.name?.toLowerCase() ?? "");

        return this.jumpGroups.filter((g) => g.name.toLowerCase().includes(filter));
    }
}
