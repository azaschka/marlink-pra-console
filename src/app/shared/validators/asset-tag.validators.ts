import { AbstractControl, ValidationErrors } from "@angular/forms";
import { StringSanitizer } from "../helpers/string-sanitizer";

/**
 * Validators for the asset tag of Jump Items, Jump Clients and Jump Client Installers (MARLINKPRA-71).
 *
 * The tag is mandatory. Because the tag is normalized before it is sent (see `StringSanitizer.sanitizeTag`),
 * a value such as "###" is not empty as typed but would be empty as sent. This validator catches that case,
 * so the form never submits a tag the PRA API would reject.
 */
export class AssetTagValidators {
    /**
     * Returns `{ invalidTag: true }` when the typed value is not empty but contains no character that survives
     * the normalization. Returns `null` for an empty value so that `Validators.required` reports emptiness
     * (one error per problem), and `null` for every value that has a canonical form.
     */
    static canonical(control: AbstractControl): ValidationErrors | null {
        const value = control.value;
        if (typeof value !== "string" || value.trim() === "") {
            return null; // Delegate empty-check to Validators.required
        }
        return StringSanitizer.sanitizeTag(value) === ""
            ? { invalidTag: true }
            : null;
    }
}
