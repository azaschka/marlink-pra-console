import { BusinessUnit } from "../../views/pra-users/enums";

export interface PraUser {
    username: string;
    displayName: string;
    role: string;
    businessUnit?: BusinessUnit;
    canManagePraUsers?: boolean;
}
