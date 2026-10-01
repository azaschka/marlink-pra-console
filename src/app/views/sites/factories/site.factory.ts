import {
    ParsedSite,
    ParsedSiteAuditor,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedUser,
    ParsedUserType,
} from "../../../shared/services/site-excel-parser.service";
import { FieldValidators, StringSanitizer } from "../../../shared/helpers";
import {
    CreateSiteDtoInput,
    SiteSupportTeamMemberDtoInput,
    SiteAuditorDtoInput,
    SiteManagerDtoInput,
} from "../models";
import {
    SiteSupportTeamAccessLevel,
    SiteSupportTeamTrustLevel,
    SiteUserSourceType,
} from "../enums";

export class SiteFactoryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SiteFactoryError";
    }
}

export class SiteFactory {
    public static create(
        site: ParsedSite,
        customerKey: string,
        siteAuditors: ParsedSiteAuditor[],
        siteManagers: ParsedSiteManager[],
        siteApprovers: string[],
        supportTeams: ParsedSupportTeam[],
        users: ParsedUser[],
    ): CreateSiteDtoInput {
        if (!site) throw new SiteFactoryError("Site input is missing.");

        if (!customerKey) {
            throw new SiteFactoryError("Customer id is missing.");
        }

        const key = this.sanitizeKey(site.key);
        if (!key) throw new SiteFactoryError("Site id is missing or empty.");

        const name = this.sanitizeName(site.name);
        if (!name) throw new SiteFactoryError("Site name is missing or empty.");

        if (!siteManagers.length)
            throw new SiteFactoryError(
                "At least one site manager is required.",
            );
        const sanitizedManagers = this.sanitizeSiteManagers(siteManagers);

        const sanitizedAuditors = this.sanitizeSiteAuditors(siteAuditors);

        this.sanitizeSiteApprovers(siteApprovers);

        const siteSupportTeamMembers = this.sanitizeSupportTeamMembers(
            supportTeams,
            users,
        );

        return {
            key,
            name,
            customerKey,
            siteManagers: sanitizedManagers,
            siteAuditors: sanitizedAuditors,
            siteApprovers,
            siteSupportTeamMembers,
        };
    }

    private static sanitizeKey(key: string): string {
        if (!key) return "";
        let out = key.trim();
        out = StringSanitizer.replaceSpecialCharacters(out);
        out = StringSanitizer.removeSpecialCharacters(out);
        return out;
    }

    private static sanitizeName(name: string): string {
        if (!name) return "";
        let out = name.trim();
        out = StringSanitizer.replaceWhitespaceWithUnderscore(out);
        out = StringSanitizer.replaceHyphensWithUnderscore(out);
        out = StringSanitizer.replaceSpecialCharacters(out);
        out = StringSanitizer.removeSpecialCharacters(out);
        return out.toUpperCase();
    }

    private static sanitizeSiteManagers(
        siteManagers: ParsedSiteManager[],
    ): SiteManagerDtoInput[] {
        if (!siteManagers?.length) return [];
        return siteManagers.map((manager) => {
            if (!manager.email) {
                throw new SiteFactoryError(
                    `Site manager is missing email: ${JSON.stringify(manager)}`,
                );
            }
            if (!FieldValidators.isValidEmail(manager.email)) {
                throw new SiteFactoryError(
                    `Site manager has invalid email: ${JSON.stringify(manager)}`,
                );
            }
            return {
                username: manager.email,
                email: manager.email,
                sourceType: this.toSourceType(manager.userType),
            };
        });
    }

    private static sanitizeSiteApprovers(siteApprovers: string[]): string[] {
        if (!siteApprovers?.length) return [];
        return siteApprovers.map((approver) => {
            const email = approver?.trim();
            if (!FieldValidators.isValidEmail(email)) {
                throw new SiteFactoryError(
                    `Site approver has invalid email: ${JSON.stringify(
                        approver,
                    )}`,
                );
            }
            return email;
        });
    }

    private static sanitizeSiteAuditors(
        siteAuditors: ParsedSiteAuditor[],
    ): SiteAuditorDtoInput[] {
        if (!siteAuditors?.length) return [];
        return siteAuditors.map((auditor) => {
            if (!auditor.email) {
                throw new SiteFactoryError(
                    `Site auditor is missing email: ${JSON.stringify(auditor)}`,
                );
            }
            if (!FieldValidators.isValidEmail(auditor.email)) {
                throw new SiteFactoryError(
                    `Site auditor has invalid email: ${JSON.stringify(auditor)}`,
                );
            }
            return {
                username: auditor.email,
                email: auditor.email,
                isAdminOperator: auditor.isAdminOperator,
                sourceType: this.toSourceType(auditor.userType),
            };
        });
    }

    private static sanitizeSupportTeamMembers(
        supportTeams: ParsedSupportTeam[],
        users: ParsedUser[],
    ): SiteSupportTeamMemberDtoInput[] {
        if (!users?.length) return [];
        return users.map((user) => {
            const team = supportTeams.find((t) => t.teamName === user.teamName);
            if (!team) {
                throw new SiteFactoryError(
                    `No support team found for user: ${user.firstName} ${user.lastName}`,
                );
            }

            const email = user.email?.trim();
            if (!FieldValidators.isValidEmail(email)) {
                throw new SiteFactoryError(
                    `User has invalid email: ${JSON.stringify(user)}`,
                );
            }
            if (!team.accessLevel || !team.trustLevel) {
                throw new SiteFactoryError(
                    `Support team is missing access or trust level: ${JSON.stringify(
                        team,
                    )}`,
                );
            }

            const supportTeamName = this.sanitizeSupportTeamName(team.teamName);
            if (!supportTeamName) {
                throw new SiteFactoryError(
                    `Support team has invalid name: ${team.teamName}`,
                );
            }

            const supportTeamAccessLevel =
                team.accessLevel as unknown as SiteSupportTeamAccessLevel;
            if (
                !FieldValidators.isValidEnumValue(
                    SiteSupportTeamAccessLevel,
                    supportTeamAccessLevel,
                )
            ) {
                throw new SiteFactoryError(
                    `Support team has invalid access level: ${team.accessLevel}`,
                );
            }

            const supportTeamTrustLevel =
                team.trustLevel as unknown as SiteSupportTeamTrustLevel;
            if (
                !FieldValidators.isValidEnumValue(
                    SiteSupportTeamTrustLevel,
                    supportTeamTrustLevel,
                )
            ) {
                throw new SiteFactoryError(
                    `Support team has invalid trust level: ${team.trustLevel}`,
                );
            }
            return {
                firstname: user.firstName,
                lastname: user.lastName,
                email: email,
                supportTeamName,
                supportTeamAccessLevel,
                supportTeamTrustLevel,
                sourceType: this.toSourceType(user.userType),
            };
        });
    }

    /**
     * Maps the workbook's LOCAL/EXTERNAL to the API's internal/external. A missing type (for example data built
     * without the parser) is treated as LOCAL, the behaviour of PRA Console 3.1.
     */
    private static toSourceType(userType: ParsedUserType | undefined): SiteUserSourceType {
        return userType === ParsedUserType.External ? SiteUserSourceType.External : SiteUserSourceType.Internal;
    }

    private static sanitizeSupportTeamName(input: string): string {
        if (!input) return "";
        let out = input.trim();
        out = StringSanitizer.replaceWhitespaceWithUnderscore(out);
        out = StringSanitizer.replaceSpecialCharacters(out);
        out = StringSanitizer.removeSpecialCharacters(out);
        return out.toUpperCase();
    }
}
