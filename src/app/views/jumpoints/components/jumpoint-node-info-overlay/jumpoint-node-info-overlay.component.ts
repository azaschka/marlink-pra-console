import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { JumpointDeploymentNode } from "../../models";

export interface JumpointNodeInfoDialogData {
    jumpointName: string;
    node: JumpointDeploymentNode;
}

@Component({
    selector: "app-jumpoint-node-info-overlay",
    templateUrl: "./jumpoint-node-info-overlay.component.html",
    styleUrls: ["./jumpoint-node-info-overlay.component.scss"],
})
export class JumpointNodeInfoOverlayComponent {
    constructor(
        public readonly dialogRef: MatDialogRef<JumpointNodeInfoOverlayComponent>,
        @Inject(MAT_DIALOG_DATA)
        public readonly data: JumpointNodeInfoDialogData,
    ) {}

    public get node(): JumpointDeploymentNode {
        return this.data.node;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getStepColor(done: any): string {
        return done ? "#4caf50" : "#ff9800";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getStepIcon(done: any): string {
        return done ? "check_circle" : "error_outline";
    }
}
