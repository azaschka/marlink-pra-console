import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface ErrorDialogData {
    title?: string;
    message?: string;
}

@Component({
    selector: "app-error-dialog",
    template: `
        <h1 mat-dialog-title class="mb-8">{{ data.title }}</h1>
        <div
            mat-dialog-content
            class="mb-16"
            style="line-height: 1.6;"
            [innerHTML]="data.message"
        ></div>
        <div mat-dialog-actions class="pb-16">
            <span fxFlex></span>
            <button
                type="button"
                mat-raised-button
                color="primary"
                (click)="dialogRef.close()"
            >
                OK
            </button>
        </div>
    `,
})
export class ErrorDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ErrorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData
    ) {}
}
