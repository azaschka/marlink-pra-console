import { FormControl } from "@angular/forms";
import { AssetTagValidators } from "./asset-tag.validators";

describe("AssetTagValidators.canonical", () => {
    const validate = (value: unknown) =>
        AssetTagValidators.canonical(new FormControl(value));

    it("delegates the empty check to Validators.required", () => {
        expect(validate("")).toBeNull();
        expect(validate("   ")).toBeNull();
        expect(validate(null)).toBeNull();
    });

    it("accepts a tag that has a canonical form", () => {
        expect(validate("acme site-01")).toBeNull();
        expect(validate("ACME_SITE_01")).toBeNull();
        expect(validate("Müller")).toBeNull();
    });

    it("rejects a tag that is empty after normalization", () => {
        expect(validate("###")).toEqual({ invalidTag: true });
        expect(validate("  §$%  ")).toEqual({ invalidTag: true });
    });
});
