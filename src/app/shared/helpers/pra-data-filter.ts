import { BusinessUnit } from "app/views/pra-users/enums";

// ---------------------------------------------------------------------------
// Module-level exported constants
// ---------------------------------------------------------------------------

/**
 * Maps each Business Unit code to its dedicated operator group policy name.
 * Single source of truth used by `GroupPoliciesComponent`,
 * `UserOverlayComponent`, and `UsersComponent`.
 */
export const BU_OPERATOR_GP_MAP: Record<string, string> = {
    MT: "GP_MARITIME_OPERATORS",
    EG: "GP_EEG_OPERATORS",
    OA: "GP_OMNIACCESS_OPERATORS",
    TE: "GP_TELEMAR_OPERATORS",
    MC: "GP_CYBER_OPERATORS",
};

/**
 * Maps each Business Unit code to the default group policy of its
 * externally provisioned (SAML) users, e.g. users who sign in through
 * Entra ID. The policies are created manually on each BeyondTrust instance.
 *
 * BeyondTrust adds a new external user to the policy of its Business Unit
 * at the first sign-in. The membership lets the BU Admins of that Business
 * Unit find the user before it has a site role and assign group policies
 * manually. pra-api removes the membership when site ingestion has given
 * the user the policies of its site role (`BU_SAML_DEFAULT_GP_MAP` in
 * `pra-api/src/site/workflows/group-policies/bu-saml-default-group-policy.workflow.ts`).
 * Keep both maps in sync.
 */
export const BU_SAML_DEFAULT_GP_MAP: Record<string, string> = {
    MT: "GP_MARITIME_SAML_DEFAULT",
    EG: "GP_EEG_SAML_DEFAULT",
    OA: "GP_OMNIACCESS_SAML_DEFAULT",
    TE: "GP_TELEMAR_SAML_DEFAULT",
    MC: "GP_CYBER_SAML_DEFAULT",
};

/**
 * Global group policies that are always visible to **every** BU Admin,
 * regardless of business unit or customer assignment.
 *
 * Note: `GP_MARLINK_OPERATORS` is intentionally **excluded** here.
 * That policy is reserved for Super Admin assignment only and must not
 * appear in the policy picker or policy list for BU Admins.
 */
export const GLOBAL_SPECIAL_GROUP_POLICIES = new Set<string>([
    "GP_FULL_ACCESS",
    "FULL_ACCESS",
    "GP_LIMITED_ACCESS",
    "LIMITED_ACCESS",
]);

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

    /**
     * Filters items to only those whose `jumpGroupId` is present in the
     * provided set of allowed IDs.
     *
     * Use this in combination with `filterByCustomerPrefix` on jump groups
     * (picking `codeName`) to restrict the list view to the jump groups a
     * BU Admin is allowed to see.
     *
     * Jump group `codeName` follows the pattern
     * `{customer_name}_{support_team_name}` (always lowercase). Because
     * `filterByCustomerPrefix` normalises both sides to uppercase before
     * comparing, the casing difference is handled automatically.
     *
     * @param items      Array of items that carry a `jumpGroupId` property.
     * @param allowedIds Set of permitted jump group IDs.
     */
    public static filterByAllowedJumpGroupIds<T extends { jumpGroupId: number }>(
        items: T[],
        allowedIds: Set<number>,
    ): T[] {
        return items.filter((item) => allowedIds.has(item.jumpGroupId));
    }

    /**
     * Determines whether a single group policy name should be visible to a
     * BU Admin.  A policy is visible when it matches **any** of these criteria:
     *
     *  1. It is a global special policy (GP_FULL_ACCESS, GP_LIMITED_ACCESS …)
     *  2. It is the BU-specific operator policy (GP_MARITIME_OPERATORS for MT …)
     *  3. It is the BU-specific default policy of external users
     *     (GP_MARITIME_SAML_DEFAULT for MT …)
     *  4. Its name starts with the BU code prefix, e.g. `MT_` or `GP_MT_`
     *  5. Its name contains one of the customer names belonging to the BU
     *
     * This is the **single source of truth** for BU Admin visibility and is
     * shared by `GroupPoliciesComponent`, `UserOverlayComponent`, and
     * `UsersComponent` (where it is applied per-policy on a user's policy list).
     *
     * @param policyName    The group policy name to evaluate.
     * @param buCode        The Business Unit code of the current admin (e.g. `"MT"`).
     * @param customerNames Lower-cased customer names that belong to the BU.
     */
    public static isGroupPolicyNameVisibleForBuAdmin(
        policyName: string,
        buCode: string,
        customerNames: string[],
    ): boolean {
        const upperName = policyName.toUpperCase();

        // 1. Global special policies
        if (GLOBAL_SPECIAL_GROUP_POLICIES.has(upperName)) {
            return true;
        }

        // 2. BU-specific operator policy, e.g. "GP_MARITIME_OPERATORS" for MT
        const buOperatorGp = BU_OPERATOR_GP_MAP[buCode];
        if (buOperatorGp && upperName === buOperatorGp) {
            return true;
        }

        // 3. BU-specific default policy of external (SAML) users, e.g.
        //    "GP_MARITIME_SAML_DEFAULT" for MT. BeyondTrust adds a new external
        //    user to it at the first sign-in, so the BU Admins of that Business
        //    Unit see the user before site ingestion assigns its site policies.
        const buSamlDefaultGp = BU_SAML_DEFAULT_GP_MAP[buCode];
        if (buSamlDefaultGp && upperName === buSamlDefaultGp) {
            return true;
        }

        // 4. BU prefix match, e.g. "MT_..." or "GP_MT_..."
        const buPrefix = `${buCode}_`;
        if (policyName.startsWith(buPrefix) || policyName.startsWith(`GP_${buPrefix}`)) {
            return true;
        }

        // 5. Customer name substring match
        const lowerName = policyName.toLowerCase();
        return customerNames.some((cn) => lowerName.includes(cn));
    }

    /**
     * Filters an array of objects that carry a `name` property (e.g.
     * `GroupPolicy[]`) to those visible to the current BU Admin.
     *
     * Delegates each item to `isGroupPolicyNameVisibleForBuAdmin`.
     *
     * Using a generic `T extends { name: string }` constraint instead of
     * importing domain types keeps `shared/` free from feature-module
     * dependencies.
     *
     * @param policies      Items to filter — must have a `name: string` field.
     * @param buCode        Business Unit code of the current admin.
     * @param customerNames Lower-cased customer names belonging to the BU.
     */
    public static filterGroupPoliciesByBuAdmin<T extends { name: string }>(
        policies: T[],
        buCode: string,
        customerNames: string[],
    ): T[] {
        return policies.filter((policy) =>
            PraDataFilter.isGroupPolicyNameVisibleForBuAdmin(policy.name, buCode, customerNames),
        );
    }
}
