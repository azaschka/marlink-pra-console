import { SiteUserSourceType } from "../enums";

export interface SiteManagerDtoInput {
    username: string;
    email: string;
    sourceType: SiteUserSourceType;
}
