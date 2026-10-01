import { SiteUserSourceType } from "../enums";

export interface SiteAuditor {
    username: string;
    email: string;
    isAdminOperator: boolean;
    /** Absent when the PRA API predates R3.2-A003. */
    sourceType?: SiteUserSourceType;
}
