import { SiteUserSourceType } from "../enums";

export interface SiteManager {
    username: string;
    email: string;
    /** Absent when the PRA API predates R3.2-A003. */
    sourceType?: SiteUserSourceType;
}
