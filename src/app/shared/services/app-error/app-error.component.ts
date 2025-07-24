import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, Inject } from "@angular/core";

@Component({
    selector: "app-error",
    template: `<h1 matDialogTitle class="mb-8">{{ data.title }}</h1>
        <div mat-dialog-content class="mb-16">{{ data.message }}</div>
        <div mat-dialog-actions class="pb-16">
            &nbsp;
            <span fxFlex></span>
            <button
                type="button"
                mat-raised-button
                color="primary"
                (click)="dialogRef.close()"
            >
                OK
            </button>
        </div>`,
})
export class AppErrorComponent {
    constructor(
        public dialogRef: MatDialogRef<AppErrorComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}
}
