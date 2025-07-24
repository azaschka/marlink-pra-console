import {
    SiteSupportTeamAccessLevel,
    SiteSupportTeamTrustLevel,
} from "../enums";

export interface SiteSupportTeamMemberDtoInput {
    firstname: string;
    lastname: string;
    email: string;
    supportTeamName: string;
    supportTeamAccessLevel: SiteSupportTeamAccessLevel;
    supportTeamTrustLevel: SiteSupportTeamTrustLevel;
}
