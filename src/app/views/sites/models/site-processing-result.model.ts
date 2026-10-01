import { Site } from "./site.model";

/** One entry of the error report returned by POST /sites and DELETE /sites/{id} (PRA API R3.2). */
export interface SiteErrorReportItem {
    type: string;
    message: string;
    /** "site-manager" | "site-auditor" | "site-support-team-member" when the entry concerns one site user. */
    siteUserType?: string;
    email?: string;
}

export interface SiteErrorReport {
    items: SiteErrorReportItem[];
}

/**
 * Response of POST /sites. The site fields stay at the top level (PRA API 3.1 shape); `errorReport` is absent
 * when the API predates R3.2-A003.
 */
export type SiteProcessingResult = Site & { errorReport?: SiteErrorReport };
