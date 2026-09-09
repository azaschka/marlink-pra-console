import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
    ConfirmDialogComponent,
    ConfirmationDialogData,
} from "./confirm-dialog.component";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ConfirmDialogService {
    constructor(private dialog: MatDialog) {}

    public show(data: ConfirmationDialogData = {}): Promise<boolean> {
        data.title = data.title || "Confirm";
        data.message = data.message || "Are you sure?";
        data.cancelLabel = data.cancelLabel || "Cancel";
        data.okLabel = data.okLabel || "OK";
        const dialogRef: MatDialogRef<ConfirmDialogComponent, boolean> =
            this.dialog.open(ConfirmDialogComponent, {
                width: "380px",
                disableClose: true,
                data,
            });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
