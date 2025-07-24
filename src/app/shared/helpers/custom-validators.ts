import {
    AbstractControl,
    FormControl,
    FormGroup,
    ValidationErrors,
    ValidatorFn,
} from "@angular/forms";

/**
 * @see https://angular.io/guide/form-validation#defining-custom-validators
 */
export class CustomValidators {
    public static passwordsMatch(
        passwordField = "password",
        retypeField = "retypePassword"
    ): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            if (!(group instanceof FormGroup)) return null;
            const password = group.controls[passwordField]?.value;
            const retype = group.controls[retypeField]?.value;
            const retypeControl = group.controls[retypeField];

            if (password && retype && password !== retype) {
                retypeControl?.setErrors({
                    ...retypeControl.errors,
                    mustMatch: true,
                });
                return { passwordsMismatch: true };
            } else {
                if (retypeControl?.hasError("mustMatch")) {
                    const errors = { ...retypeControl.errors };
                    delete errors["mustMatch"];
                    if (Object.keys(errors).length === 0) {
                        retypeControl.setErrors(null);
                    } else {
                        retypeControl.setErrors(errors);
                    }
                }
                return null;
            }
        };
    }

    public static noWhitespace(
        control: AbstractControl
    ): ValidationErrors | null {
        const isWhitespace =
            (control.value || "").toString().trim().length === 0;
        return isWhitespace ? { whitespace: true } : null;
    }

    // TODO: Check if this is still needed.
    public noSpecialChars(control: FormControl): {
        [key: string]: boolean;
    } {
        const specialCharsRegExp: RegExp =
            /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

        if (control.value && specialCharsRegExp.test(control.value)) {
            return { invalidValue: true };
        }
    }
}
