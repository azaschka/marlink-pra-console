import { Component, Inject } from "@angular/core";
import {
    MAT_SNACK_BAR_DATA,
    MatSnackBarRef,
} from "@angular/material/snack-bar";
import { SnackbarData } from "../../models";

@Component({
    selector: "app-snackbar",
    templateUrl: "./snackbar.component.html",
})
export class SnackbarComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public readonly snackbarData: SnackbarData,
        @Inject(MatSnackBarRef)
        public readonly snackbarRef: MatSnackBarRef<SnackbarComponent>
    ) {}

    public actionButtonClickHandler(): void {
        console.log("snack clicked!");
    }
}
