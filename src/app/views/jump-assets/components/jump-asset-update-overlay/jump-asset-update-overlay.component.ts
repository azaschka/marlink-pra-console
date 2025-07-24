import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { JumpGroup } from "../../../jump-groups/models";
import { JumpPolicy } from "../../../jump-policies/models";
import { Observable, of, startWith, map } from "rxjs";

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
    currentJumpGroupId: number;
    currentJumpGroupType: string;
    currentJumpPolicyId: number | null;
}

@Component({
    selector: "app-jump-asset-update-overlay",
    templateUrl: "./jump-asset-update-overlay.component.html",
})
export class JumpAssetUpdateOverlayComponent implements OnInit {
    public isLoading = false;
    public jumpGroups: JumpGroup[] = [];
    public jumpPolicies: JumpPolicy[] = [];
    public filteredJumpGroups$: Observable<JumpGroup[]> = of([]);
    public filteredJumpPolicies$: Observable<JumpPolicy[]> = of([]);

    public form: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<JumpAssetUpdateOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: JumpAssetUpdateDialogData,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService
    ) {
        this.form = new FormGroup({
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
            ]),
            jumpPolicy: new FormControl<JumpPolicy | null>(null), // null = keine Policy
        });
    }

    public async ngOnInit() {
        this.isLoading = true;
        try {
            this.jumpGroups = await this.jumpGroupsService.fetchJumpGroups();
            this.jumpPolicies =
                await this.jumpPoliciesService.fetchJumpPolicies();

            // Vorbelegen der aktuellen Werte:
            const currentJumpGroup =
                this.jumpGroups.find(
                    (g) => g.id === this.data.currentJumpGroupId
                ) || null;
            const currentJumpPolicy = this.data.currentJumpPolicyId
                ? this.jumpPolicies.find(
                      (p) => p.id === this.data.currentJumpPolicyId
                  ) || null
                : null;

            this.form.patchValue({
                jumpGroup: currentJumpGroup,
                jumpPolicy: currentJumpPolicy,
            });

            this.filteredJumpGroups$ = this.form
                .get("jumpGroup")!
                .valueChanges.pipe(
                    startWith(currentJumpGroup),
                    map((val) => this._filterJumpGroups(val))
                );

            this.filteredJumpPolicies$ = this.form
                .get("jumpPolicy")!
                .valueChanges.pipe(
                    startWith(currentJumpPolicy),
                    map((val) => this._filterJumpPolicies(val))
                );
        } finally {
            this.isLoading = false;
        }
    }

    public displayHeadline(): string {
        switch (this.data.assetType) {
            case "remoteRdp":
                return "Update Remote RDP";
            case "shellJump":
                return "Update Shell Jump";
            case "webJump":
                return "Update Web Jump";
            case "remoteVnc":
                return "Update Remote VNC";
            case "protocolTunnel":
                return "Update Protocol Tunnel";
            case "jumpClient":
                return "Update Jump Client";
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

    public submit() {
        if (this.form.invalid) return;
        const { jumpGroup, jumpPolicy } = this.form.value;
        this.dialogRef.close({
            jumpGroupId: jumpGroup.id,
            jumpGroupType: "shared",
            jumpPolicyId: jumpPolicy ? jumpPolicy.id : null,
        });
    }

    public cancel() {
        this.dialogRef.close(null);
    }

    public displayJumpGroup(jumpGroup: JumpGroup | null): string {
        return jumpGroup ? jumpGroup.name : "";
    }
    public displayJumpPolicy(jumpPolicy: JumpPolicy | null): string {
        return jumpPolicy ? jumpPolicy.displayName : "— No Jump Policy —";
    }

    private _filterJumpGroups(value: string | JumpGroup | null): JumpGroup[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : value?.name?.toLowerCase() ?? "";

        return this.jumpGroups.filter((g) =>
            g.name.toLowerCase().includes(filter)
        );
    }

    private _filterJumpPolicies(
        value: string | JumpPolicy | null
    ): JumpPolicy[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : value?.displayName?.toLowerCase() ?? "";

        return this.jumpPolicies.filter((p) =>
            p.displayName.toLowerCase().includes(filter)
        );
    }
}
