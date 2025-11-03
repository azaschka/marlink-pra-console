import { BusinessUnit, UserRole } from "../enums";

export interface PraUserCreateRequest {
    username: string;
    email: string;
    role: UserRole;
    displayName: string;
    businessUnit?: BusinessUnit;
    canManagePraUsers?: boolean;
}
