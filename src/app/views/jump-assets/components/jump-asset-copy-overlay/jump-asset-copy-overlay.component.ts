import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpAssetCopyRequest } from "../../models";
import { JumpGroup } from "../../../jump-groups/models";
import { Observable, of, startWith, map, firstValueFrom } from "rxjs";
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

@Component({
    selector: "app-jump-asset-copy-overlay",
    templateUrl: "./jump-asset-copy-overlay.component.html",
})
export class JumpAssetCopyOverlayComponent implements OnInit {
    public isLoading = false;
    public jumpGroups: JumpGroup[] = [];
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public form: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<JumpAssetCopyOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CopyJumpAssetDialogData,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly customersService: CustomersService,
        private readonly jwtAuthService: JwtAuthService,
    ) {
        this.form = new FormGroup({
            name: new FormControl(`Copy of ${data.defaultName}`, [
                Validators.required,
            ]),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
            ]),
        });
    }

    public async ngOnInit() {
        this.isLoading = true;
        try {
            const tenantId = this.data.tenantId;
            const user = await firstValueFrom(this.jwtAuthService.praUser);
            const businessUnit = user?.businessUnit;

            const allJumpGroups =
                await this.jumpGroupsService.fetchJumpGroups(tenantId);

            if (businessUnit) {
                // BU Admin — filter jump groups by customer name prefix
                const customers = await this.customersService.fetchCustomers({
                    businessUnits: [
                        businessUnit as unknown as CustomerBusinessUnit,
                    ],
                    pageSize: 9999,
                });
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

            this.filteredJumpGroups$ = this.form
                .get("jumpGroup")!
                .valueChanges.pipe(
                    startWith(""),
                    map((val) => this._filterJumpGroups(val)),
                );
        } finally {
            this.isLoading = false;
        }
    }

    public displayHeadline(): string {
        switch (this.data.assetType) {
            case "remoteRdp":
                return "Copy Remote RDP";
            case "shellJump":
                return "Copy Shell Jump";
            case "webJump":
                return "Copy Web Jump";
            case "remoteVnc":
                return "Copy Remote VNC";
            case "protocolTunnel":
                return "Copy Protocol Tunnel";
            case "jumpClient":
                return "Copy Jump Client";
            default:
                return "Unknown Asset Type";
        }
    }

    public displayJumpAssetName(): string {
        switch (this.data.assetType) {
            case "remoteRdp":
                return "Remote RDP Name";
            case "shellJump":
                return "Shell Jump Name";
            case "webJump":
                return "Web Jump Name";
            case "remoteVnc":
                return "Remote VNC Name";
            case "protocolTunnel":
                return "Protocol Tunnel Name";
            case "jumpClient":
                return "Jump Client Name";
            default:
                return "Unknown Asset Type";
        }
    }

    public displayJumpGroup(jumpGroup: JumpGroup): string {
        return jumpGroup ? jumpGroup.name : "";
    }

    public async submit() {
        if (this.form.invalid) return;
        const { name, jumpGroup } = this.form.value;
        const request: JumpAssetCopyRequest = {
            name: name.trim(),
            jumpGroupId: jumpGroup.id,
            jumpGroupType: "shared",
        };
        this.dialogRef.close(request);
    }

    public cancel() {
        this.dialogRef.close(null);
    }

    private _filterJumpGroups(value: string | JumpGroup | null): JumpGroup[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : (value?.name?.toLowerCase() ?? "");

        return this.jumpGroups.filter((g) =>
            g.name.toLowerCase().includes(filter),
        );
    }
}
