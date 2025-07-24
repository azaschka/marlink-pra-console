import { Component, ViewChild } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressBar } from "@angular/material/progress-bar";

@Component({
    selector: "app-lockscreen",
    templateUrl: "./lockscreen.component.html",
    styleUrls: ["./lockscreen.component.scss"],
})
export class LockscreenComponent {
    @ViewChild(MatProgressBar) progressBar: MatProgressBar;
    @ViewChild(MatButton) submitButton: MatButton;

    public lockscreenData = {
        password: "",
    };

    public unlock(): void {
        console.log(this.lockscreenData);

        this.submitButton.disabled = true;
        this.progressBar.mode = "indeterminate";
    }
}
