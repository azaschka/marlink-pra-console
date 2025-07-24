import { SiteAdministratorDtoInput } from "./site-administrator-dto-input.model";
import { SiteManagerDtoInput } from "./site-manager-dto-input.model";
import { SiteSupportTeamMemberDtoInput } from "./site-support-team-member-dto-input.model";

export interface CreateSiteDtoInput {
    key: string;
    name: string;
    customerKey: string;
    siteManagers: SiteManagerDtoInput[];
    siteAdministrators?: SiteAdministratorDtoInput[];
    siteSupportTeamMembers?: SiteSupportTeamMemberDtoInput[];
}
