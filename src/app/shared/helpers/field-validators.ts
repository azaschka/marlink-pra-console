export class FieldValidators {
    /**
     * Validates an enum value against the provided enum object.
     * Returns true if the value is a valid enum value, false otherwise.
     */
    public static isValidEnumValue<T>(
        enumObj: T,
        value: unknown
    ): value is T[keyof T] {
        return Object.values(enumObj).includes(value as any);
    }

    /**
     * Validates a username.
     * Allows alphanumeric, underscore, dot, or valid email address.
     * Returns true if valid, false otherwise.
     */
    public static isValidUsername(username: string): boolean {
        if (!username) return false;

        // Check if username is an email
        if (this.isValidEmail(username)) return true;

        // Otherwise, check for allowed pattern
        // - Must be 3-50 chars, only letters, numbers, _, . (no consecutive dots/underscores, not starting/ending with . or _)
        const usernameRegex = /^(?![_\.])[a-zA-Z0-9._]{3,50}(?<![_\.])$/;
        if (!usernameRegex.test(username)) return false;

        // No double dots or underscores
        if (username.includes("..") || username.includes("__")) return false;

        return true;
    }

    /**
     * Validates an email address using a simple regex.
     * Returns true if valid, false otherwise.
     */
    public static isValidEmail(email: string): boolean {
        if (!email) return false;

        // Basic email pattern (not RFC strict, but covers 99% cases)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);
    }
}
