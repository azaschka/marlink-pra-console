import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";
import { NotificationDialogComponent } from "./notification-dialog.component";

export interface NotificationDialogData {
    message: string;
    action?: string;
    icon?: string;
    duration?: number;
    onAction?: () => void;
}

@Injectable()
export class NotificationDialogService {
    constructor(private snackBar: MatSnackBar) {}

    public show(data: NotificationDialogData): void {
        const config: MatSnackBarConfig = {
            duration: data.duration ?? 6000,
            horizontalPosition: "center",
            verticalPosition: "top",
            data,
        };
        const snackBarRef = this.snackBar.openFromComponent(
            NotificationDialogComponent,
            config
        );

        // Falls eine Aktion definiert wurde, beim Button-Klick aufrufen
        snackBarRef.instance.actionButtonClickHandler = () => {
            data.onAction?.();
            snackBarRef.dismiss();
        };
    }
}
