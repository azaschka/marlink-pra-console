import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import {
    ErrorDialogComponent,
    ErrorDialogData,
} from "./error-dialog.component";
import { firstValueFrom } from "rxjs";

@Injectable()
export class ErrorDialogService {
    constructor(private dialog: MatDialog) {}

    public show(data: ErrorDialogData = {}): Promise<void> {
        data.title = data.title || "Error";
        data.message =
            data.message ||
            "An unknown error occurred. Please try again later.";
        const dialogRef: MatDialogRef<ErrorDialogComponent, void> =
            this.dialog.open(ErrorDialogComponent, {
                width: "380px",
                disableClose: true,
                data,
            });
        return firstValueFrom(dialogRef.afterClosed());
    }
}
