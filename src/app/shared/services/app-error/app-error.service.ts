import { Observable } from "rxjs";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { Injectable } from "@angular/core";

import { AppErrorComponent } from "./app-error.component";

export interface ErrorData {
    title?: string;
    message?: string;
}

@Injectable()
export class AppErrorService {
    constructor(private dialog: MatDialog) {}

    public show(data: ErrorData = {}): Observable<boolean> {
        data.title = data.title || "Error";
        data.message =
            data.message ||
            "Some unknown error occured. Please try again later.";

        let dialogRef: MatDialogRef<AppErrorComponent>;
        dialogRef = this.dialog.open(AppErrorComponent, {
            width: "380px",
            disableClose: true,
            data: { title: data.title, message: data.message },
        });

        return dialogRef.afterClosed();
    }
}
