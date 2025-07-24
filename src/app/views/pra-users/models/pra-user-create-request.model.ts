import { BusinessUnit, UserRole } from "../enums";

export interface PraUserCreateRequest {
    username: string;
    password: string;
    email: string;
    role: UserRole;
    displayName: string;
    businessUnit?: BusinessUnit;
}
