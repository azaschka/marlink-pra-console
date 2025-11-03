import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { JumpGroupsService } from "../../../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../../../jump-policies/jump-policies.service";
import { JumpGroup } from "../../../jump-groups/models";
import { JumpPolicy } from "../../../jump-policies/models";
import { Observable, of, startWith, map } from "rxjs";
import { JumpAssetUpdateRequest } from "../../models";
import { StringSanitizer } from "app/shared/helpers";

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
    currentMustVerifyCertificate?: boolean;
}

@Component({
    selector: "app-jump-asset-update-overlay",
    templateUrl: "./jump-asset-update-overlay.component.html",
})
export class JumpAssetUpdateOverlayComponent implements OnInit {
    private static readonly DEFAULT_REMOTE_VNC_PORT = 5900;
    private static readonly DEFAULT_SHELL_JUMP_PORT = 22;
    private static readonly MINIMUM_PORT_NUMBER = 1;
    private static readonly MAXIMUM_PORT_NUMBER = 65535;

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
            name: new FormControl<string>(data.currentName, [
                Validators.required,
            ]),
            tag: new FormControl<string>(data.currentTag ?? "", []),
            hostname: new FormControl<string>(data.currentHostname ?? "", [
                Validators.required,
            ]),
            port: new FormControl<number | null>(
                data.currentPort ?? null,
                [] // Validators kommen dynamisch im ngOnInit, je nach Asset-Typ
            ),
            jumpGroup: new FormControl<JumpGroup | null>(null, [
                Validators.required,
            ]),
            jumpPolicy: new FormControl<JumpPolicy | null>(null),
            mustVerifyCertificate: new FormControl<boolean>(
                data.currentMustVerifyCertificate || false
            ),
        });
    }

    public async ngOnInit() {
        this.isLoading = true;
        try {
            this.jumpGroups = await this.jumpGroupsService.fetchJumpGroups();
            this.jumpPolicies =
                await this.jumpPoliciesService.fetchJumpPolicies();

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

            this.setPortValidators();

            // Filter
            this.filteredJumpGroups$ = this.form
                .get("jumpGroup")!
                .valueChanges.pipe(
                    startWith(currentJumpGroup),
                    map((val) => this.filterJumpGroups(val))
                );
            this.filteredJumpPolicies$ = this.form
                .get("jumpPolicy")!
                .valueChanges.pipe(
                    startWith(currentJumpPolicy),
                    map((val) => this.filterJumpPolicies(val))
                );

            this.setVerifyCertificateValidators();
        } finally {
            this.isLoading = false;
        }
    }

    // Zeigt/hidet das Port-Feld für die entsprechenden Typen:
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
        switch (this.data.assetType) {
            case "remoteRdp":
                return "Remote RDP";
            case "shellJump":
                return "Shell Jump";
            case "webJump":
                return "Web Jump";
            case "remoteVnc":
                return "Remote VNC";
            case "protocolTunnel":
                return "Protocol Tunnel";
            case "jumpClient":
                return "Jump Client";
            default:
                return "Unknown Asset Type";
        }
    }

    public submit() {
        if (this.form.invalid) return;
        const {
            name,
            tag,
            hostname,
            port,
            mustVerifyCertificate,
            jumpGroup,
            jumpPolicy,
        } = this.form.value;
        this.dialogRef.close({
            name: name?.trim(),
            tag: JumpAssetUpdateOverlayComponent.sanitizeString(tag),
            hostname:
                this.data.assetType !== "webJump"
                    ? hostname?.trim()
                    : undefined,
            url:
                this.data.assetType === "webJump"
                    ? hostname?.trim()
                    : undefined,
            port: this.showPortField() ? port : undefined,
            jumpGroupId: jumpGroup.id,
            jumpGroupType: "shared",
            jumpPolicyId: jumpPolicy ? jumpPolicy.id : null,
            mustVerifyCertificate: this.showMustVerifyCertificate()
                ? mustVerifyCertificate
                : undefined,
        } as JumpAssetUpdateRequest);
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

    private setPortValidators(): void {
        if (this.showPortField()) {
            this.form
                .get("port")
                ?.setValidators([
                    Validators.required,
                    Validators.min(
                        JumpAssetUpdateOverlayComponent.MINIMUM_PORT_NUMBER
                    ),
                    Validators.max(
                        JumpAssetUpdateOverlayComponent.MAXIMUM_PORT_NUMBER
                    ),
                ]);
            // Default Port, falls noch nicht gesetzt:
            if (!this.form.get("port")?.value) {
                this.form
                    .get("port")
                    ?.setValue(
                        this.data.currentPort ||
                            (this.data.assetType === "remoteVnc"
                                ? JumpAssetUpdateOverlayComponent.DEFAULT_REMOTE_VNC_PORT
                                : JumpAssetUpdateOverlayComponent.DEFAULT_SHELL_JUMP_PORT)
                    );
            }
        } else {
            this.form.get("port")?.clearValidators();
            this.form.get("port")?.setValue(null);
        }
        this.form.get("port")?.updateValueAndValidity();
    }

    private setVerifyCertificateValidators(): void {
        if (this.showMustVerifyCertificate()) {
            if (!this.form.get("mustVerifyCertificate")?.value) {
                this.form
                    .get("mustVerifyCertificate")
                    .setValue(this.data.currentMustVerifyCertificate || false);
            }
        } else {
            this.form.get("mustVerifyCertificate")?.setValue(false);
            this.form.get("mustVerifyCertificate")?.clearValidators();
        }
        this.form.get("mustVerifyCertificate")?.updateValueAndValidity();
    }

    private filterJumpGroups(value: string | JumpGroup | null): JumpGroup[] {
        const filter =
            typeof value === "string"
                ? value.toLowerCase()
                : value?.name?.toLowerCase() ?? "";

        return this.jumpGroups.filter((g) =>
            g.name.toLowerCase().includes(filter)
        );
    }

    private filterJumpPolicies(
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

    /**
     * Sanitizes a string by replacing whitespace with underscores, removing special characters, and converting to uppercase.
     * @param value The string to sanitize.
     * @returns The sanitized string.
     */
    private static sanitizeString(value: string): string {
        let sanitizeString =
            StringSanitizer.replaceWhitespaceWithUnderscore(value);
        sanitizeString =
            StringSanitizer.replaceSpecialCharacters(sanitizeString);
        sanitizeString =
            StringSanitizer.removeSpecialCharacters(sanitizeString);

        return sanitizeString.toUpperCase();
    }
}
