import { SiteAdministrator } from "./site-administrator.model";
import { SiteManager } from "./site-manager.model";
import { SiteSupportTeamMember } from "./site-support-team-member.model";

export interface Site {
    id: number;
    key: string;
    name: string;
    customerKey: string;
    siteManagers: SiteManager[];
    siteAdministrators: SiteAdministrator[];
    siteSupportTeamMembers: SiteSupportTeamMember[];
    creationDate: string;
    lastModificationDate?: string;
    jumpPointCodeName?: string;
}
