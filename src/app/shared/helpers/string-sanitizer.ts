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
}
