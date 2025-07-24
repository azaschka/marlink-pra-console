import { BusinessUnit, UserRole } from "../enums";

export interface PraUserUpdateRequest {
    username?: string;
    password?: string;
    email?: string;
    role?: UserRole;
    displayName?: string;
    businessUnit?: BusinessUnit;
}
