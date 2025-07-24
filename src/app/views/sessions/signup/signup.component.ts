import { Component, OnInit, ViewChild } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MatProgressBar } from "@angular/material/progress-bar";
import {
    Validators,
    UntypedFormGroup,
    UntypedFormControl,
} from "@angular/forms";

@Component({
    selector: "app-signup",
    templateUrl: "./signup.component.html",
    styleUrls: ["./signup.component.scss"],
})
export class SignupComponent implements OnInit {
    @ViewChild(MatProgressBar) progressBar: MatProgressBar;
    @ViewChild(MatButton) submitButton: MatButton;

    public signupForm: UntypedFormGroup;

    public ngOnInit(): void {
        const password = new UntypedFormControl("", Validators.required);

        this.signupForm = new UntypedFormGroup({
            email: new UntypedFormControl("", [
                Validators.required,
                Validators.email,
            ]),
            password: password,
            agreed: new UntypedFormControl(
                "",
                (control: UntypedFormControl) => {
                    const agreed = control.value;
                    if (!agreed) {
                        return { agreed: true };
                    }
                    return null;
                }
            ),
        });
    }

    public signup(): void {
        const signupData = this.signupForm.value;
        console.log(signupData);

        this.submitButton.disabled = true;
        this.progressBar.mode = "indeterminate";
    }
}
