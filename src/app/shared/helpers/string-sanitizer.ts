import { SPECIAL_CHAR_MAP } from "./special-char-map";

export class StringSanitizer {
    public static removeWhitespace(value: string | undefined | null): string {
        return value ? value.trim() : "";
    }

    public static replaceWhitespaceWithUnderscore(
        value: string | undefined | null,
    ): string {
        if (!value) return "";
        return value.trim().replace(/\s+/g, "_");
    }

    public static replaceSpecialCharacters(value: string): string {
        return value.replace(
            /[\u00C0-\u017F]/g,
            (char) => SPECIAL_CHAR_MAP[char] || char,
        );
    }

    public static replaceHyphensWithUnderscore(
        value: string | undefined | null,
    ): string {
        if (!value) return "";
        return value.replace(/-/g, "_");
    }

    public static removeSpecialCharacters(
        value: string | undefined | null,
    ): string {
        if (!value) return "";
        return value.replace(/[^a-zA-Z0-9_]/g, "");
    }

    /**
     * Canonical form of an asset tag (Jump Items, Jump Clients, Jump Client Installers).
     * Whitespace and hyphens become underscores, special characters are mapped or removed,
     * the result is UPPERCASE. Every place that creates or edits a tag must use this method,
     * otherwise an edit produces a different tag than ingestion or manual creation.
     * Must stay in sync with NameSanitizerUtility.sanitizeTag in PRA API. Idempotent.
     */
    public static sanitizeTag(value: string | undefined | null): string {
        let s = StringSanitizer.replaceWhitespaceWithUnderscore(value);
        s = StringSanitizer.replaceHyphensWithUnderscore(s);
        s = StringSanitizer.replaceSpecialCharacters(s);
        s = StringSanitizer.removeSpecialCharacters(s);
        return s.toUpperCase();
    }
}
