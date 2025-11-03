import { BusinessUnit, UserRole } from "../enums";

export interface PraUserUpdateRequest {
    username?: string;
    email?: string;
    role?: UserRole;
    displayName?: string;
    businessUnit?: BusinessUnit;
    canManagePraUsers?: boolean;
    regeneratePassword?: boolean;
}
