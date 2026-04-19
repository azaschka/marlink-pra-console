import { Component, ViewChild } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressBar } from "@angular/material/progress-bar";
import { AppRoute } from "app/shared/enums";

@Component({
    selector: "app-lockscreen",
    templateUrl: "./lockscreen.component.html",
    styleUrls: ["./lockscreen.component.scss"],
})
export class LockscreenComponent {
    @ViewChild(MatProgressBar) progressBar: MatProgressBar;
    @ViewChild(MatButton) submitButton: MatButton;

    public readonly AppRoute = AppRoute;

    public lockscreenData = {
        password: "",
    };

    public unlock(): void {
        console.log(this.lockscreenData);

        this.submitButton.disabled = true;
        this.progressBar.mode = "indeterminate";
    }
}
