import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface ConfirmationDialogData {
    title?: string;
    message?: string;
    cancelLabel?: string;
    okLabel?: string;
}

@Component({
    selector: "app-confirm-dialog",
    template: `
        <h1 mat-dialog-title class="mb-8">{{ data.title }}</h1>

        <div
            mat-dialog-content
            class="mb-16"
            style="line-height: 1.6;"
            [innerHTML]="data.message"
        ></div>

        <div mat-dialog-actions class="pb-16">
            <button
                type="button"
                color="warn"
                mat-raised-button
                (click)="dialogRef.close(false)"
            >
                {{ data.cancelLabel }}
            </button>

            <span fxFlex></span>

            <button
                type="button"
                mat-raised-button
                color="primary"
                (click)="dialogRef.close(true)"
            >
                {{ data.okLabel }}
            </button>
        </div>
    `,
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
    ) {}
}
