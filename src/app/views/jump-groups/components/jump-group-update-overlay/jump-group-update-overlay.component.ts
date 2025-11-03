import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { JumpGroupUpdateRequest } from "../../models/jump-group-update-request.model";

export interface JumpGroupUpdateDialogData {
    currentName: string;
}

@Component({
    selector: "app-jump-group-update-overlay",
    templateUrl: "./jump-group-update-overlay.component.html",
})
export class JumpGroupUpdateOverlayComponent {
    public isLoading = false;
    public form: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<JumpGroupUpdateOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: JumpGroupUpdateDialogData
    ) {
        this.form = new FormGroup({
            name: new FormControl<string>(data.currentName, [
                Validators.required,
            ]),
        });
    }

    public submit() {
        if (this.form.invalid) return;
        const { name } = this.form.value;
        this.dialogRef.close({
            name: name?.trim(),
        } as JumpGroupUpdateRequest);
    }

    public cancel() {
        this.dialogRef.close(null);
    }
}
