import type {
    ParsedSiteAuditor,
    ParsedSiteManager,
    ParsedUser,
    SiteExcelIssue,
} from "./site-excel-parser.service";

interface UserEntryLocation {
    role: string;
    email: string;
    userType: string;
    sheet: string;
    row: number;
    typeColumn: string;
}

export interface SiteUserConsolidationResult {
    siteAuditors: ParsedSiteAuditor[];
    siteManagers: ParsedSiteManager[];
    users: ParsedUser[];
    issues: SiteExcelIssue[];
    notices: string[];
}

/**
 * Cross-row rules for the people listed in an ingestion workbook (R3.2-A003).
 *
 * A BeyondTrust identity has exactly one type, local or external. The workbook lists one person per cell, possibly
 * several times and in several roles, so contradictions have to be caught before the import starts instead of
 * surfacing as a type mismatch halfway through it:
 *   - the same person listed twice in the same role with identical values is merged and reported as a notice,
 *   - the same person listed twice in the same role with different values is an error,
 *   - the same person in several roles with different types is an error,
 *   - the same person in several roles with the same type is allowed; the roles share one BeyondTrust account.
 *
 * Emails are compared case-insensitively, as BeyondTrust does.
 */
export class SiteUserConsolidation {
    private static readonly SHEET_SITE = "site";
    private static readonly SHEET_USERS = "users";

    public static consolidate(
        siteAuditors: ParsedSiteAuditor[],
        siteManagers: ParsedSiteManager[],
        users: ParsedUser[],
    ): SiteUserConsolidationResult {
        const issues: SiteExcelIssue[] = [];
        const notices: string[] = [];

        const keptManagers = SiteUserConsolidation.dedupe(
            siteManagers,
            (manager) => SiteUserConsolidation.normalize(manager.email),
            (first, duplicate) =>
                first.userType === duplicate.userType
                    ? null
                    : {
                          sheet: SiteUserConsolidation.SHEET_SITE,
                          row: duplicate.rowNumber,
                          column: "SITE MANAGER TYPE",
                          message: `site manager ${duplicate.email} is listed again with type ${duplicate.userType}; row ${first.rowNumber} says ${first.userType}.`,
                      },
            (first, duplicate) =>
                `Site manager ${first.email} is listed in rows ${first.rowNumber} and ${duplicate.rowNumber} of sheet "site"; imported once.`,
            issues,
            notices,
        );

        const keptAuditors = SiteUserConsolidation.dedupe(
            siteAuditors,
            (auditor) => SiteUserConsolidation.normalize(auditor.email),
            (first, duplicate) => {
                if (first.userType !== duplicate.userType) {
                    return {
                        sheet: SiteUserConsolidation.SHEET_SITE,
                        row: duplicate.rowNumber,
                        column: "SITE AUDITOR TYPE",
                        message: `site auditor ${duplicate.email} is listed again with type ${duplicate.userType}; row ${first.rowNumber} says ${first.userType}.`,
                    };
                }
                if (first.isAdminOperator !== duplicate.isAdminOperator) {
                    return {
                        sheet: SiteUserConsolidation.SHEET_SITE,
                        row: duplicate.rowNumber,
                        column: "IS AUDITOR OPERATOR",
                        message: `site auditor ${duplicate.email} is listed again with a different auditor operator flag than in row ${first.rowNumber}.`,
                    };
                }
                return null;
            },
            (first, duplicate) =>
                `Site auditor ${first.email} is listed in rows ${first.rowNumber} and ${duplicate.rowNumber} of sheet "site"; imported once.`,
            issues,
            notices,
        );

        // A support team member is one row per team, so the same person may legitimately appear for two teams.
        const keptUsers = SiteUserConsolidation.dedupe(
            users,
            (user) => `${SiteUserConsolidation.normalize(user.email)}|${user.teamName.trim().toUpperCase()}`,
            (first, duplicate) =>
                first.userType === duplicate.userType
                    ? null
                    : {
                          sheet: SiteUserConsolidation.SHEET_USERS,
                          row: duplicate.rowNumber,
                          column: "USER TYPE",
                          message: `${duplicate.email} is listed again for team ${duplicate.teamName} with type ${duplicate.userType}; row ${first.rowNumber} says ${first.userType}.`,
                      },
            (first, duplicate) =>
                `User ${first.email} is listed for team ${first.teamName} in rows ${first.rowNumber} and ${duplicate.rowNumber} of sheet "users"; imported once.`,
            issues,
            notices,
        );

        SiteUserConsolidation.checkAcrossRoles(
            [
                ...keptManagers.map((manager) => ({
                    role: "site manager",
                    email: manager.email,
                    userType: manager.userType,
                    sheet: SiteUserConsolidation.SHEET_SITE,
                    row: manager.rowNumber,
                    typeColumn: "SITE MANAGER TYPE",
                })),
                ...keptAuditors.map((auditor) => ({
                    role: "site auditor",
                    email: auditor.email,
                    userType: auditor.userType,
                    sheet: SiteUserConsolidation.SHEET_SITE,
                    row: auditor.rowNumber,
                    typeColumn: "SITE AUDITOR TYPE",
                })),
                ...keptUsers.map((user) => ({
                    role: `support team member (${user.teamName})`,
                    email: user.email,
                    userType: user.userType,
                    sheet: SiteUserConsolidation.SHEET_USERS,
                    row: user.rowNumber,
                    typeColumn: "USER TYPE",
                })),
            ],
            issues,
            notices,
        );

        return { siteAuditors: keptAuditors, siteManagers: keptManagers, users: keptUsers, issues, notices };
    }

    public static normalize(email: string): string {
        return (email ?? "").trim().toLowerCase();
    }

    private static dedupe<T>(
        entries: T[],
        keyOf: (entry: T) => string,
        conflictOf: (first: T, duplicate: T) => SiteExcelIssue | null,
        noticeOf: (first: T, duplicate: T) => string,
        issues: SiteExcelIssue[],
        notices: string[],
    ): T[] {
        const firstByKey = new Map<string, T>();
        const kept: T[] = [];

        for (const entry of entries) {
            const key = keyOf(entry);
            const first = firstByKey.get(key);

            if (first === undefined) {
                firstByKey.set(key, entry);
                kept.push(entry);
                continue;
            }

            const conflict = conflictOf(first, entry);
            if (conflict) {
                issues.push(conflict);
            } else {
                notices.push(noticeOf(first, entry));
            }
        }

        return kept;
    }

    private static checkAcrossRoles(entries: UserEntryLocation[], issues: SiteExcelIssue[], notices: string[]): void {
        const entriesByEmail = new Map<string, UserEntryLocation[]>();

        for (const entry of entries) {
            const key = SiteUserConsolidation.normalize(entry.email);
            const group = entriesByEmail.get(key) ?? [];
            group.push(entry);
            entriesByEmail.set(key, group);
        }

        entriesByEmail.forEach((group) => {
            if (group.length < 2) {
                return;
            }

            const reference = group[0];
            const conflicting = group.filter((entry) => entry.userType !== reference.userType);

            if (conflicting.length > 0) {
                for (const entry of conflicting) {
                    issues.push({
                        sheet: entry.sheet,
                        row: entry.row,
                        column: entry.typeColumn,
                        message:
                            `${entry.email} is ${entry.userType} as ${entry.role} but ${reference.userType} as ` +
                            `${reference.role} (sheet "${reference.sheet}", row ${reference.row}). ` +
                            `One person has exactly one account type.`,
                    });
                }
                return;
            }

            const roles = group.map((entry) => entry.role).join(", ");
            notices.push(
                `${reference.email} is listed as ${roles}. All roles use the same BeyondTrust account (${reference.userType}).`,
            );
        });
    }
}
