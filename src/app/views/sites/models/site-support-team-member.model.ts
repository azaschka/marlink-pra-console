import {
    SiteSupportTeamAccessLevel,
    SiteSupportTeamTrustLevel,
    SiteUserSourceType,
} from "../enums";

export interface SiteSupportTeamMember {
    firstname: string;
    lastname: string;
    email: string;
    supportTeamName: string;
    supportTeamAccessLevel: SiteSupportTeamAccessLevel;
    supportTeamTrustLevel: SiteSupportTeamTrustLevel;
    /** Absent when the PRA API predates R3.2-A003. */
    sourceType?: SiteUserSourceType;
}
