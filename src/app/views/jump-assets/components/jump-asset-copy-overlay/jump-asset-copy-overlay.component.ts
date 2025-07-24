import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpAssetCopyRequest } from "../../models";
import { JumpGroup } from "../../../jump-groups/models";
import { Observable, of, startWith, map } from "rxjs";

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
        private readonly jumpGroupsService: JumpGroupsService
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
            this.jumpGroups = await this.jumpGroupsService.fetchJumpGroups();
            this.filteredJumpGroups$ = this.form
                .get("jumpGroup")!
                .valueChanges.pipe(
                    startWith(""),
                    map((val) => this._filterJumpGroups(val))
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
                : value?.name?.toLowerCase() ?? "";

        return this.jumpGroups.filter((g) =>
            g.name.toLowerCase().includes(filter)
        );
    }
}
