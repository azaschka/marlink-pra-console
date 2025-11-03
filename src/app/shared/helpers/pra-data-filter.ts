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
        pickers: Array<(x: T) => string | undefined>
    ): T[] {
        if (!businessUnit) return items;

        const rx = new RegExp(`(?:^|_)${businessUnit}(?:_|$)`, "i");

        return items.filter((it) =>
            pickers.some((p) => {
                const val = (p(it) ?? "").trim();

                return val !== "" && rx.test(val);
            })
        );
    }
}
