import { BusinessUnit, UserRole } from "../enums";

export interface PraUser {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    displayName: string;
    businessUnit?: BusinessUnit;
    canManagePraUsers?: boolean;
    creationDate: string | Date;
    lastModificationDate?: string | Date;
}
