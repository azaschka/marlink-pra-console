import { SiteErrorReportItem } from "../models";

/**
 * Turns PRA API error report entries into one readable line per affected user (R3.2-A003, 3.1(2)).
 * The raw API message is kept where it carries the specifics; the added sentence says what to do about it.
 */
export class SiteErrorReportFormatter {
    private static readonly ROLE_LABELS: Record<string, string> = {
        "site-manager": "Site manager",
        "site-auditor": "Site auditor",
        "site-support-team-member": "Support team member",
    };

    /** Reads the items from a POST /sites response body or a 422 error body; tolerant of older API versions. */
    public static itemsOf(body: unknown): SiteErrorReportItem[] {
        if (!body || typeof body !== "object") {
            return [];
        }
        const report = (body as { errorReport?: unknown }).errorReport;
        const items = Array.isArray(report) ? report : (report as { items?: unknown } | undefined)?.items;
        return Array.isArray(items) ? (items as SiteErrorReportItem[]) : [];
    }

    /** HTML list for dialogs that render HTML; every value is escaped because it comes from user data. */
    public static formatHtmlList(items: SiteErrorReportItem[]): string {
        const escape = (value: string) =>
            value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        return `<ul>${items.map((item) => `<li>${escape(SiteErrorReportFormatter.format(item))}</li>`).join("")}</ul>`;
    }

    public static format(item: SiteErrorReportItem): string {
        const subject = SiteErrorReportFormatter.subjectOf(item);
        return `${subject}: ${SiteErrorReportFormatter.describe(item)}`;
    }

    private static subjectOf(item: SiteErrorReportItem): string {
        const role = item.siteUserType ? SiteErrorReportFormatter.ROLE_LABELS[item.siteUserType] ?? item.siteUserType : undefined;
        if (role && item.email) {
            return `${role} ${item.email}`;
        }
        if (item.email) {
            return item.email;
        }
        return role ?? "Site";
    }

    private static describe(item: SiteErrorReportItem): string {
        switch (item.type) {
            case "UserNotFoundException":
                return (
                    "not found in BeyondTrust, nothing was assigned. An external user has to log in to BeyondTrust " +
                    "once; the platform picks up new users within 30 minutes. Run the import again afterwards."
                );
            case "MultipleUsersFoundException":
                return "matches more than one BeyondTrust account, nothing was assigned. Resolve the duplicate accounts first.";
            case "SourceTypeMismatchException":
                return `${item.message} Correct the user type in the workbook.`;
            case "GroupPolicyAssignmentFailedException":
                return `some group policy memberships could not be applied. ${item.message}`;
            default:
                return item.message;
        }
    }
}
