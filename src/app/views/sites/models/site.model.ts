import { SiteAuditor } from "./site-auditor.model";
import { SiteManager } from "./site-manager.model";
import { SiteSupportTeamMember } from "./site-support-team-member.model";

export interface Site {
    id: number;
    key: string;
    name: string;
    customerKey: string;
    siteManagers: SiteManager[];
    siteAuditors: SiteAuditor[];
    siteSupportTeamMembers: SiteSupportTeamMember[];
    siteApprovers: string[];
    creationDate: string;
    lastModificationDate?: string;
    jumpPointCodeName?: string;
    customerName?: string;
    totalLicenseUsage?: number;
    licenseUsageLoading?: boolean;
}
