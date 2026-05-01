import { ChangeDetectorRef, Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { JumpointDeploymentNode } from "../../models";
import { JumpointNodeBusinessUnit } from "../../enums";
import { JumpointsService } from "../../jumpoints.service";

// ── Public types ─────────────────────────────────────────────────────────────

export interface JumpointDeployDialogData {
    /** codeName of the Jumpoint, e.g. "MT_JPOI1_GANI_INC_DANNY_1_77771" */
    jumpointName: string;
    /** Extracted from codeName, e.g. "77771" */
    siteKey: string;
    /** Extracted from codeName, e.g. JumpointNodeBusinessUnit.MT */
    businessUnit: JumpointNodeBusinessUnit;
    /** Passed for retry scenarios; undefined for a fresh deployment */
    existingNode?: JumpointDeploymentNode;
}

export type DeploymentStepStatus =
    | "pending"
    | "running"
    | "success"
    | "skipped"
    | "failed";

export interface DeploymentStepDef {
    label: string;
    description: string;
    status: DeploymentStepStatus;
    error?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
    selector: "app-jumpoint-deploy-overlay",
    templateUrl: "./jumpoint-deploy-overlay.component.html",
    styleUrls: ["./jumpoint-deploy-overlay.component.scss"],
})
export class JumpointDeployOverlayComponent {
    public deploymentSteps: DeploymentStepDef[];
    public currentNode: JumpointDeploymentNode | null;
    public isDeploying = false;
    public deploymentComplete = false;

    constructor(
        public readonly dialogRef: MatDialogRef<JumpointDeployOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public readonly data: JumpointDeployDialogData,
        private readonly jumpointsService: JumpointsService,
        private readonly cdr: ChangeDetectorRef,
    ) {
        this.currentNode = data.existingNode ?? null;
        this.deploymentSteps = this.buildInitialSteps();
    }

    // ── Computed getters ────────────────────────────────────────────────────

    /** True if any step still needs to be executed (pending) or previously failed. */
    public get hasAnyPendingStep(): boolean {
        return this.deploymentSteps.some(
            (s) => s.status === "pending" || s.status === "failed",
        );
    }

    /** True when the dialog can be dismissed (not while async work is in progress). */
    public get canClose(): boolean {
        return !this.isDeploying;
    }

    /** True if at least one step ended in an error state. */
    public get hasFailed(): boolean {
        return this.deploymentSteps.some((s) => s.status === "failed");
    }

    /** Label for the primary action button (Start vs Retry). */
    public get retryLabel(): string {
        if (this.data.existingNode && this.hasAnyPendingStep) {
            return "Retry Deployment";
        }
        return "Start Deployment";
    }

    // ── Icon helpers ────────────────────────────────────────────────────────

    public getStepIcon(status: DeploymentStepStatus): string {
        switch (status) {
            case "success":
            case "skipped":
                return "check_circle";
            case "failed":
                return "error";
            case "running":
                return "hourglass_top";
            default:
                return "radio_button_unchecked";
        }
    }

    public getStepIconColor(status: DeploymentStepStatus): string {
        switch (status) {
            case "success":
            case "skipped":
                return "accent"; // green
            case "failed":
                return "warn"; // red
            case "running":
                return "primary"; // blue
            default:
                return "";
        }
    }

    // ── Deployment sequence ─────────────────────────────────────────────────

    public async startDeployment(): Promise<void> {
        this.isDeploying = true;
        try {
            // ── Step 1: Create Node ────────────────────────────────────────
            if (!this.currentNode) {
                this.deploymentSteps[0].status = "running";
                this.cdr.detectChanges();
                try {
                    const node = await this.jumpointsService.createDeploymentNode(
                        this.data.siteKey,
                        this.data.businessUnit,
                    );
                    this.currentNode = node;
                    this.deploymentSteps[0].status = "success";
                    this.cdr.detectChanges();
                } catch (err) {
                    this.deploymentSteps[0].status = "failed";
                    this.deploymentSteps[0].error = this.extractErrorMessage(err);
                    this.cdr.detectChanges();
                    return;
                }
            } else {
                // Node already exists (retry mode) — skip this step
                this.deploymentSteps[0].status = "skipped";
            }

            // ── Step 2: Assign Service ─────────────────────────────────────
            if (!this.currentNode!.serviceType) {
                this.deploymentSteps[1].status = "running";
                this.cdr.detectChanges();
                try {
                    const node = await this.jumpointsService.createDeploymentNodeService(
                        this.currentNode!.id,
                    );
                    this.currentNode = node;
                    this.deploymentSteps[1].status = "success";
                    this.cdr.detectChanges();
                } catch (err) {
                    this.deploymentSteps[1].status = "failed";
                    this.deploymentSteps[1].error = this.extractErrorMessage(err);
                    this.cdr.detectChanges();
                    return;
                }
            } else {
                this.deploymentSteps[1].status = "skipped";
            }

            // ── Step 3: Approve ────────────────────────────────────────────
            if (!this.currentNode!.hasApproval) {
                this.deploymentSteps[2].status = "running";
                this.cdr.detectChanges();
                try {
                    const node = await this.jumpointsService.approveDeploymentNode(
                        this.currentNode!.id,
                    );
                    this.currentNode = node;
                    this.deploymentSteps[2].status = "success";
                    this.cdr.detectChanges();
                } catch (err) {
                    this.deploymentSteps[2].status = "failed";
                    this.deploymentSteps[2].error = this.extractErrorMessage(err);
                    this.cdr.detectChanges();
                    return;
                }
            } else {
                this.deploymentSteps[2].status = "skipped";
            }

            // ── Step 4: Generate ISO (stored server-side) ─────────────────
            if (!this.currentNode!.isoFilePath) {
                this.deploymentSteps[3].status = "running";
                this.cdr.detectChanges();
                try {
                    const node = await this.jumpointsService.downloadDeploymentNodeIso(
                        this.currentNode!.id,
                    );
                    this.currentNode = node;
                    this.deploymentSteps[3].status = "success";
                    this.cdr.detectChanges();
                } catch (err) {
                    this.deploymentSteps[3].status = "failed";
                    this.deploymentSteps[3].error = this.extractErrorMessage(err);
                    this.cdr.detectChanges();
                    return;
                }
            } else {
                this.deploymentSteps[3].status = "skipped";
            }

            // ── All steps succeeded or were skipped ────────────────────────
            this.deploymentComplete = true;
            this.cdr.detectChanges();
            // Auto-close and return the final node to the parent
            setTimeout(() => this.dialogRef.close(this.currentNode), 1500);
        } finally {
            this.isDeploying = false;
            this.cdr.detectChanges();
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private buildInitialSteps(): DeploymentStepDef[] {
        const node = this.data.existingNode;
        return [
            {
                label: "Create Node",
                description: "Register the jumpoint deployment node in the system",
                // Node already exists in retry mode → skip
                status: node ? "skipped" : "pending",
            },
            {
                label: "Assign Service",
                description: "Assign the PRA service to the deployment node",
                status: node
                    ? node.serviceType
                        ? "skipped"
                        : "pending"
                    : "pending",
            },
            {
                label: "Approve",
                description: "Approve the deployment node for ISO generation",
                status: node
                    ? node.hasApproval === true
                        ? "skipped"
                        : "pending"
                    : "pending",
            },
            {
                label: "Generate ISO",
                description: "Generate and store the ISO boot image server-side",
                status: node
                    ? node.isoFilePath
                        ? "skipped"
                        : "pending"
                    : "pending",
            },
        ];
    }

    private extractErrorMessage(err: any): string {
        return (
            err?.error?.message ??
            err?.message ??
            "An unexpected error occurred. Please try again."
        );
    }
}
