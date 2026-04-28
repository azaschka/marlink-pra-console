import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { JumpGroupUpdateRequest } from "../../models/jump-group-update-request.model";

export interface JumpGroupUpdateDialogData {
    currentName: string;
}

interface UpdateForm {
    name: FormControl<string>;
}

@Component({
    selector: "app-jump-group-update-overlay",
    templateUrl: "./jump-group-update-overlay.component.html",
})
export class JumpGroupUpdateOverlayComponent {
    public isLoading = false;
    public form: FormGroup<UpdateForm>;

    constructor(
        public dialogRef: MatDialogRef<JumpGroupUpdateOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: JumpGroupUpdateDialogData,
    ) {
        this.form = new FormGroup<UpdateForm>({
            name: new FormControl<string>(data.currentName, {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }

    public submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { name } = this.form.getRawValue();
        this.dialogRef.close({ name: name.trim() } as JumpGroupUpdateRequest);
    }

    public cancel(): void {
        this.dialogRef.close(null);
    }
}
