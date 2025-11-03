import {
    ParsedSite,
    ParsedSiteAdministrator,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedUser,
} from "../../../shared/services/site-excel-parser.service";
import { FieldValidators, StringSanitizer } from "../../../shared/helpers";
import {
    CreateSiteDtoInput,
    SiteSupportTeamMemberDtoInput,
    SiteAdministratorDtoInput,
    SiteManagerDtoInput,
} from "../models";
import {
    SiteSupportTeamAccessLevel,
    SiteSupportTeamTrustLevel,
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
        siteAdministrators: ParsedSiteAdministrator[],
        siteManagers: ParsedSiteManager[],
        siteApprovers: string[],
        supportTeams: ParsedSupportTeam[],
        users: ParsedUser[]
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
                "At least one site manager is required."
            );
        this.sanitizeSiteManagers(siteManagers);

        this.sanitizeSiteAdministrators(siteAdministrators);

        this.sanitizeSiteApprovers(siteApprovers);

        const siteSupportTeamMembers = this.sanitizeSupportTeamMembers(
            supportTeams,
            users
        );

        return {
            key,
            name,
            customerKey,
            siteManagers,
            siteAdministrators,
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
        out = StringSanitizer.replaceSpecialCharacters(out);
        out = StringSanitizer.removeSpecialCharacters(out);
        return out.toUpperCase();
    }

    private static sanitizeSiteManagers(
        siteManagers: ParsedSiteManager[]
    ): SiteManagerDtoInput[] {
        if (!siteManagers?.length) return [];
        return siteManagers.map((manager) => {
            if (!manager.username || !manager.email) {
                throw new SiteFactoryError(
                    `Site manager is missing username or email: ${JSON.stringify(
                        manager
                    )}`
                );
            }
            if (!FieldValidators.isValidUsername(manager.username)) {
                throw new SiteFactoryError(
                    `Site manager has invalid username: ${JSON.stringify(
                        manager
                    )}`
                );
            }
            if (!FieldValidators.isValidEmail(manager.email)) {
                throw new SiteFactoryError(
                    `Site manager has invalid email: ${JSON.stringify(manager)}`
                );
            }
            return {
                username: manager.username,
                email: manager.email,
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
                        approver
                    )}`
                );
            }
            return email;
        });
    }

    private static sanitizeSiteAdministrators(
        siteAdministrators: ParsedSiteAdministrator[]
    ): SiteAdministratorDtoInput[] {
        if (!siteAdministrators?.length) return [];
        return siteAdministrators.map((admin) => {
            if (!admin.username || !admin.email) {
                throw new SiteFactoryError(
                    `Site administrator is missing username or email: ${JSON.stringify(
                        admin
                    )}`
                );
            }
            if (!FieldValidators.isValidUsername(admin.username)) {
                throw new SiteFactoryError(
                    `Site administrator has invalid username: ${JSON.stringify(
                        admin
                    )}`
                );
            }
            if (!FieldValidators.isValidEmail(admin.email)) {
                throw new SiteFactoryError(
                    `Site administrator has invalid email: ${JSON.stringify(
                        admin
                    )}`
                );
            }
            return {
                username: admin.username,
                email: admin.email,
                isAdminOperator: admin.isAdminOperator,
            };
        });
    }

    private static sanitizeSupportTeamMembers(
        supportTeams: ParsedSupportTeam[],
        users: ParsedUser[]
    ): SiteSupportTeamMemberDtoInput[] {
        if (!users?.length) return [];
        return users.map((user) => {
            const team = supportTeams.find((t) => t.teamName === user.teamName);
            if (!team) {
                throw new SiteFactoryError(
                    `No support team found for user: ${user.firstName} ${user.lastName}`
                );
            }

            const email = user.email?.trim();
            if (!FieldValidators.isValidEmail(email)) {
                throw new SiteFactoryError(
                    `User has invalid email: ${JSON.stringify(user)}`
                );
            }
            if (!team.accessLevel || !team.trustLevel) {
                throw new SiteFactoryError(
                    `Support team is missing access or trust level: ${JSON.stringify(
                        team
                    )}`
                );
            }

            const supportTeamName = this.sanitizeSupportTeamName(team.teamName);
            if (!supportTeamName) {
                throw new SiteFactoryError(
                    `Support team has invalid name: ${team.teamName}`
                );
            }

            const supportTeamAccessLevel =
                team.accessLevel as unknown as SiteSupportTeamAccessLevel;
            if (
                !FieldValidators.isValidEnumValue(
                    SiteSupportTeamAccessLevel,
                    supportTeamAccessLevel
                )
            ) {
                throw new SiteFactoryError(
                    `Support team has invalid access level: ${team.accessLevel}`
                );
            }

            const supportTeamTrustLevel =
                team.trustLevel as unknown as SiteSupportTeamTrustLevel;
            if (
                !FieldValidators.isValidEnumValue(
                    SiteSupportTeamTrustLevel,
                    supportTeamTrustLevel
                )
            ) {
                throw new SiteFactoryError(
                    `Support team has invalid trust level: ${team.trustLevel}`
                );
            }
            return {
                firstname: user.firstName,
                lastname: user.lastName,
                email: email,
                supportTeamName,
                supportTeamAccessLevel,
                supportTeamTrustLevel,
            };
        });
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
