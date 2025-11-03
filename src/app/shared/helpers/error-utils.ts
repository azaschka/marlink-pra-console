export class ErrorUtils {
    private static readonly IGNORED_KEYS = ["timestamp", "path", "statusCode"];

    /**
     * Recursively extracts all meaningful error messages from a nested error object,
     * skipping technical fields like 'timestamp' or 'path'.
     * @param error The error object to parse.
     * @returns A flat array of error messages.
     */
    public static extractMessages(error: unknown): string[] {
        const messages: string[] = [];

        function recurse(value: unknown, parentKey?: string): void {
            if (typeof value === "string") {
                messages.push(value);
            } else if (Array.isArray(value)) {
                value.forEach((item) => recurse(item, parentKey));
            } else if (typeof value === "object" && value !== null) {
                for (const key of Object.keys(value)) {
                    if (!ErrorUtils.IGNORED_KEYS.includes(key)) {
                        recurse((value as Record<string, unknown>)[key], key);
                    }
                }
            }
        }

        recurse(error);

        return [...new Set(messages)];
    }
}
