import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

// Components
import { SnackbarComponent } from "../components/snackbar/snackbar.component";

// Models
import { SnackbarData } from "../models";

@Injectable()
export class SnackbarService {
    constructor(private readonly snackBar: MatSnackBar) {}

    /**
     * @param message The message to show in the snackbar
     */
    public showDefaultSnackbar(message: string): void {
        const snackbarConfig: MatSnackBarConfig = {
            duration: 10000,
            horizontalPosition: "end",
            verticalPosition: "top",
        };

        const snackbarData: SnackbarData = {
            message: message,
            action: undefined,
            urlToNavigateTo: undefined,
        };

        this.snackBar.openFromComponent(SnackbarComponent, {
            data: snackbarData,
            ...snackbarConfig,
        });
    }

    /**
     * @param message The message to show in the snackbar
     * @param action (Optional) The label for the snackbar action
     * @param urlToNavigateTo (Optional) The internal url to navigate to, after action button has been clicked
     */
    public showSnackbarWithInteralUrlAction(
        message: string,
        action?: string,
        urlToNavigateTo?: string
    ): void {
        const snackbarConfig: MatSnackBarConfig = {
            duration: 60000,
            horizontalPosition: "end",
            verticalPosition: "top",
        };

        const snackbarData: SnackbarData = {
            message: message,
            action: action,
            urlToNavigateTo: urlToNavigateTo,
        };

        this.snackBar.openFromComponent(SnackbarComponent, {
            data: snackbarData,
            ...snackbarConfig,
        });
    }
}
