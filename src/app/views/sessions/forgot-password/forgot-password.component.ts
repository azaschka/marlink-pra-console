import { Component, ViewChild } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressBar } from "@angular/material/progress-bar";
import { AppRoute } from "app/shared/enums";
@Component({
    selector: "app-forgot-password",
    templateUrl: "./forgot-password.component.html",
    styleUrls: ["./forgot-password.component.scss"],
})
export class ForgotPasswordComponent {
    @ViewChild(MatProgressBar) progressBar: MatProgressBar;
    @ViewChild(MatButton) submitButton: MatButton;

    public readonly AppRoute = AppRoute;
    public userEmail: string;

    public submitEmail(): void {
        this.submitButton.disabled = true;
        this.progressBar.mode = "indeterminate";
    }
}
