import { SiteErrorReportFormatter } from "./site-error-report.formatter";

describe("SiteErrorReportFormatter", () => {
    it("reads items from a POST /sites body and from a 422 error body", () => {
        const item = { type: "UserNotFoundException", message: "x", siteUserType: "site-manager", email: "a@b.c" };

        expect(SiteErrorReportFormatter.itemsOf({ id: 1, errorReport: { items: [item] } })).toEqual([item]);
        expect(SiteErrorReportFormatter.itemsOf({ message: "Site must have...", errorReport: [item] })).toEqual([item]);
    });

    it("returns no items for a 3.1 response without error report", () => {
        expect(SiteErrorReportFormatter.itemsOf({ id: 1, name: "SITE" })).toEqual([]);
        expect(SiteErrorReportFormatter.itemsOf(undefined)).toEqual([]);
    });

    it("names role and email and explains what to do for an unmatched user", () => {
        const line = SiteErrorReportFormatter.format({
            type: "UserNotFoundException",
            message: "User with username undefined and email a@b.c not found.",
            siteUserType: "site-support-team-member",
            email: "a@b.c",
        });

        expect(line).toContain("Support team member a@b.c: not found in BeyondTrust");
        expect(line).toContain("log in to BeyondTrust once");
    });

    it("keeps the API message for a type mismatch", () => {
        const line = SiteErrorReportFormatter.format({
            type: "SourceTypeMismatchException",
            message: 'User with email a@b.c was supplied as "internal" but BeyondTrust reports "external".',
            siteUserType: "site-auditor",
            email: "a@b.c",
        });

        expect(line).toBe(
            'Site auditor a@b.c: User with email a@b.c was supplied as "internal" but BeyondTrust reports "external". Correct the user type in the workbook.',
        );
    });

    it("falls back to the raw message for entries without a user", () => {
        expect(SiteErrorReportFormatter.format({ type: "Error", message: "timeout" })).toBe("Site: timeout");
    });

    it("escapes user data in the HTML list for the cleanup dialog", () => {
        const html = SiteErrorReportFormatter.formatHtmlList([
            { type: "Error", message: "<img src=x onerror=alert(1)>", siteUserType: "site-manager", email: "a@b.c" },
        ]);

        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
        expect(html).not.toContain("<img");
    });
});
