import { BusinessUnit } from "../../views/pra-users/enums";

/**
 * Defaults applied during PRA user creation (not exposed in the UI).
 */
export const PraUserDefaults = {
    /** Default business unit pre-selected when creating a new Admin PRA user. */
    defaultAdminBusinessUnit: BusinessUnit.MT,
} as const;
