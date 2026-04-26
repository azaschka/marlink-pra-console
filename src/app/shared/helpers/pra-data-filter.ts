import { BusinessUnit } from "app/views/pra-users/enums";

export class PraDataFilter {
    /**
     * Filters an array of items by a specific business unit.
     * @param items The array of items to filter.
     * @param businessUnit The business unit to filter by.
     * @param pickers An array of functions that extract the relevant string values from each item.
     * @returns A new array containing only the items that match the specified business unit.
     */
    public static filterByBusinessUnit<T>(
        items: T[],
        businessUnit: BusinessUnit | null | undefined,
        pickers: Array<(x: T) => string | undefined>,
    ): T[] {
        if (!businessUnit) return items;

        const rx = new RegExp(`(?:^|_)${businessUnit}(?:_|$)`, "i");

        return items.filter((it) =>
            pickers.some((p) => {
                const val = (p(it) ?? "").trim();

                return val !== "" && rx.test(val);
            }),
        );
    }

    /**
     * Filters items by checking whether a picked string field starts with any
     * of the provided customer names followed by an underscore separator.
     *
     * This is used for JumpGroups (whose `name` follows the pattern
     * `{CUSTOMER_NAME}_{TEAM_NAME}`) and JumpPolicies (whose `codeName`
     * follows `{CUSTOMER_NAME}_{SITE_NAME}_{SITE_KEY}_{SUFFIX}`).
     *
     * The match is case-insensitive.  Customer names that contain underscores
     * (e.g. `GANI_INC`) are handled correctly because we check against known
     * full customer names rather than splitting by underscore.
     *
     * **Edge-case note:** If a shorter customer name from the same BU is a
     * strict prefix of a longer customer name in a different BU (e.g. `GANI`
     * in BU-A vs `GANI_INC` in BU-B), a false-positive match is possible.
     * This is inherent to the naming convention; a direct customer→entity
     * foreign-key would be required to fully eliminate it.
     *
     * @param items        The array of items to filter.
     * @param customerNames Sanitized (uppercase) customer names belonging to
     *                      the current user's business unit.
     * @param picker       A function that extracts the relevant string value
     *                     from each item (e.g. `g => g.name` for JumpGroups).
     * @returns A new array containing only items whose picked value starts
     *          with one of the customer name prefixes.
     */
    public static filterByCustomerPrefix<T>(
        items: T[],
        customerNames: string[],
        picker: (item: T) => string | undefined,
    ): T[] {
        if (customerNames.length === 0) return [];

        // Pre-compute uppercase prefixes once — e.g. ["GANI_INC_", "ACME_"]
        const prefixes = customerNames.map((name) => name.toUpperCase() + "_");

        return items.filter((item) => {
            const value = (picker(item) ?? "").toUpperCase();
            return prefixes.some((prefix) => value.startsWith(prefix));
        });
    }
}
