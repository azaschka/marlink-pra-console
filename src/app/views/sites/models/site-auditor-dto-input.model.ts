import { SiteUserSourceType } from "../enums";

export interface SiteAuditorDtoInput {
    username: string;
    email: string;
    isAdminOperator: boolean;
    sourceType: SiteUserSourceType;
}
