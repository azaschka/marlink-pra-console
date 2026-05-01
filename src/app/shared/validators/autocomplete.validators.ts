import { AbstractControl, ValidationErrors } from "@angular/forms";

/**
 * Validators for Angular Material Autocomplete fields.
 *
 * Problem: When a user types text into a `matAutocomplete` input but does NOT
 * click an option from the dropdown, Angular Material sets the FormControl value
 * to the typed string rather than the expected object. `Validators.required`
 * passes for any non-empty string, so the form appears valid even though no
 * real object was selected. Accessing `.id` on a string yields `undefined`,
 * which causes 400 Bad Request errors from the API.
 */
export class AutocompleteValidators {
    /**
     * Validates that an autocomplete control holds an actual object with a
     * numeric `id` property, not a raw string.
     *
     * Apply this alongside `Validators.required` on any `FormControl` that is
     * bound to a `[matAutocomplete]` where the expected value is an object.
     *
     * Returns `{ invalidSelection: true }` when the value is a string or any
     * non-object that lacks a numeric `id`. Returns `null` when the value is
     * `null`/`undefined` (let `Validators.required` handle emptiness) or is a
     * valid object.
     */
    static requireSelection(
        control: AbstractControl,
    ): ValidationErrors | null {
        const value = control.value;
        if (value === null || value === undefined) {
            return null; // Delegate empty-check to Validators.required
        }
        if (typeof value === "object" && typeof value.id === "number") {
            return null; // Valid object with numeric id
        }
        return { invalidSelection: true };
    }
}
