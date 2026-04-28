import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, of, Subject, firstValueFrom } from "rxjs";
import { map, startWith, takeUntil } from "rxjs/operators";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpAssetCopyRequest } from "../../models";
import { JumpGroup } from "../../../jump-groups/models";
import { CustomersService } from "../../../customers/customers.service";
import { CustomerBusinessUnit } from "../../../customers/enums";
import { JwtAuthService } from "../../../../shared/services/auth/jwt-auth.service";
import { PraDataFilter } from "../../../../shared/helpers/pra-data-filter";

export interface CopyJumpAssetDialogData {
    assetType:
        | "remoteRdp"
        | "shellJump"
        | "webJump"
        | "remoteVnc"
        | "protocolTunnel"
        | "jumpClient";
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
    public jumpGroups: JumpGroup[] = [];
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public form: FormGroup<CopyForm>;

    constructor(
        public dialogRef: MatDialogRef<JumpAssetCopyOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CopyJumpAssetDialogData,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly customersService: CustomersService,
        private readonly jwtAuthService: JwtAuthService,
    ) {
        this.form = new FormGroup<CopyForm>({
            name: new FormControl(`Copy of ${data.defaultName}`, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
            ]),
        });
    }

    public async ngOnInit(): Promise<void> {
        this.isLoading = true;
        try {
            const tenantId = this.data.tenantId;
            const user = await firstValueFrom(this.jwtAuthService.praUser);
            const businessUnit = user?.businessUnit;

            // Load jump groups and (optionally) customers in parallel
            const [allJumpGroups, customers] = await Promise.all([
                this.jumpGroupsService.fetchJumpGroups(tenantId),
                businessUnit
                    ? this.customersService.fetchCustomers({
                          businessUnits: [
                              businessUnit as unknown as CustomerBusinessUnit,
                          ],
                          pageSize: 9999,
                      })
                    : Promise.resolve([]),
            ]);

            if (businessUnit) {
                // BU Admin — filter jump groups by customer name prefix
                const customerNames = customers.map((c) => c.name);
                this.jumpGroups = PraDataFilter.filterByCustomerPrefix(
                    allJumpGroups,
                    customerNames,
                    (g) => g.name,
                );
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
        } finally {
            this.isLoading = false;
        }
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public displayHeadline(): string {
        return (
            JumpAssetCopyOverlayComponent.headlineMap[this.data.assetType] ??
            "Copy Jump Asset"
        );
    }

    public displayJumpAssetName(): string {
        return (
            JumpAssetCopyOverlayComponent.assetNameMap[this.data.assetType] ??
            "Name"
        );
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
            jumpGroupType: "shared",
        };
        this.dialogRef.close(request);
    }

    public cancel(): void {
        this.dialogRef.close(null);
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
}
