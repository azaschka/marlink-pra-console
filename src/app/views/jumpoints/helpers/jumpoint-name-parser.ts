import { JumpointNodeBusinessUnit } from "../enums";

export interface ParsedJumpointName {
    businessUnit: JumpointNodeBusinessUnit;
    siteKey: string;
}

/**
 * Parses a jumpoint codeName following the Marlink naming convention:
 *   {BusinessUnit}_JPOI1_{CustomerName}_{SiteName}_{SiteKey}
 *
 * Example: "MT_JPOI1_GANI_INC_DANNY_1_77771"
 *   → businessUnit: JumpointNodeBusinessUnit.MT  ("MT")
 *   → siteKey:      "77771"
 *
 * Rules:
 * - BusinessUnit  = first segment (before first underscore)
 * - SiteKey       = last segment  (after last underscore)
 * - Minimum 3 underscore-separated parts required
 */
export class JumpointNameParser {
    private static readonly VALID_BUSINESS_UNITS = new Set<string>(
        Object.values(JumpointNodeBusinessUnit),
    );

    /**
     * Parses the codeName and returns the extracted fields, or null if the
     * codeName does not match the expected format.
     */
    public static parse(codeName: string | undefined | null): ParsedJumpointName | null {
        if (!codeName) {
            return null;
        }

        const parts = codeName.split('_');

        // Minimum: BU _ something _ siteKey  (3 parts)
        if (parts.length < 3) {
            return null;
        }

        const businessUnit = parts[0];
        const siteKey = parts[parts.length - 1];

        if (!JumpointNameParser.VALID_BUSINESS_UNITS.has(businessUnit)) {
            return null;
        }

        if (!siteKey) {
            return null;
        }

        return {
            businessUnit: businessUnit as JumpointNodeBusinessUnit,
            siteKey,
        };
    }
}
