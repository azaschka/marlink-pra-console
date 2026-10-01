import * as XLSX from "xlsx";
import {
    ParsedUserType,
    SiteExcelParserService,
    SiteExcelValidationError,
} from "./site-excel-parser.service";

/** Header row of the site sheet as shipped in the 3.1 template (no user type columns). */
const LEGACY_SITE_HEADERS = [
    "CUSTOMER NAME",
    "MARLINK CUSTOMER ID",
    "BUSINESS UNIT",
    "SITE NAME",
    "MARLINK SITE ID",
    "SITE AUDITOR EMAIL",
    "IS AUDITOR OPERATOR",
    "SITE APPROVER EMAIL",
    "SITE MANAGER EMAIL",
];

const TYPED_SITE_HEADERS = [
    "CUSTOMER NAME",
    "MARLINK CUSTOMER ID",
    "BUSINESS UNIT",
    "SITE NAME",
    "MARLINK SITE ID",
    "SITE AUDITOR EMAIL",
    "SITE AUDITOR TYPE",
    "IS AUDITOR OPERATOR",
    "SITE APPROVER EMAIL",
    "SITE MANAGER EMAIL",
    "SITE MANAGER TYPE",
];

function buildWorkbook(options: {
    siteHeaders: string[];
    siteRows: (string | number)[][];
    userHeaders?: string[];
    userRows?: string[][];
}): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([["SITE INFORMATION"], options.siteHeaders, ...options.siteRows]),
        "site",
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([
            ["TEAM NAME", "ACCESS LEVEL", "IS TRUSTED"],
            ["TEAM A", "FULL ACCESS", "REQUIRE AUTH"],
        ]),
        "support_teams",
    );
    XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([
            options.userHeaders ?? ["FIRST NAME", "LAST NAME", "EMAIL", "TEAM"],
            ...(options.userRows ?? []),
        ]),
        "users",
    );
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["IP ADDRESS", "SYSTEM NAME"]]), "hosts");
    return workbook;
}

function row(values: Record<string, string | number>, headers: string[]): (string | number)[] {
    return headers.map((header) => values[header] ?? "");
}

function captureValidationError(action: () => void): SiteExcelValidationError {
    try {
        action();
    } catch (error) {
        if (error instanceof SiteExcelValidationError) {
            return error;
        }
        throw error;
    }
    throw new Error("Expected a SiteExcelValidationError");
}

describe("SiteExcelParserService user types (R3.2-A003)", () => {
    const parser = new SiteExcelParserService();
    const customerCells = {
        "CUSTOMER NAME": "TEST Customer",
        "MARLINK CUSTOMER ID": "10001",
        "BUSINESS UNIT": "MT (Maritime)",
        "SITE NAME": "EXT TEST",
        "MARLINK SITE ID": "10001-1",
    };

    it("treats every user of a legacy template as LOCAL and keeps the existing values", () => {
        const workbook = buildWorkbook({
            siteHeaders: LEGACY_SITE_HEADERS,
            siteRows: [
                row(
                    {
                        ...customerCells,
                        "SITE AUDITOR EMAIL": "auditor@example.com",
                        "IS AUDITOR OPERATOR": "YES",
                        "SITE MANAGER EMAIL": "manager@example.com",
                        "SITE APPROVER EMAIL": "approver@example.com",
                    },
                    LEGACY_SITE_HEADERS,
                ),
            ],
            userRows: [["Ann", "Tech", "ann@example.com", "TEAM A"]],
        });

        const result = parser.parseWorkbook(workbook);

        expect(result.customer.key).toBe("10001");
        expect(result.siteManagers).toEqual([
            { email: "manager@example.com", userType: ParsedUserType.Local, rowNumber: 3 },
        ]);
        expect(result.siteAuditors).toEqual([
            { email: "auditor@example.com", isAdminOperator: true, userType: ParsedUserType.Local, rowNumber: 3 },
        ]);
        expect(result.siteApprovers).toEqual(["approver@example.com"]);
        expect(result.users[0]).toEqual(
            jasmine.objectContaining({ email: "ann@example.com", userType: ParsedUserType.Local, rowNumber: 2 }),
        );
        expect(result.notices).toEqual([]);
    });

    it("reads explicit types case-insensitively and defaults empty cells to LOCAL", () => {
        const workbook = buildWorkbook({
            siteHeaders: TYPED_SITE_HEADERS,
            siteRows: [
                row(
                    {
                        ...customerCells,
                        "SITE MANAGER EMAIL": "local.manager@example.com",
                        "SITE MANAGER TYPE": "",
                        "SITE AUDITOR EMAIL": "ext.auditor@example.com",
                        "SITE AUDITOR TYPE": " external ",
                    },
                    TYPED_SITE_HEADERS,
                ),
                row(
                    { "SITE MANAGER EMAIL": "ext.manager@example.com", "SITE MANAGER TYPE": "EXTERNAL" },
                    TYPED_SITE_HEADERS,
                ),
            ],
            userHeaders: ["FIRST NAME", "LAST NAME", "EMAIL", "TEAM", "USER TYPE"],
            userRows: [
                ["Ext", "Tech", "ext.tech@example.com", "TEAM A", "External"],
                ["Loc", "Tech", "loc.tech@example.com", "TEAM A", "LOCAL"],
            ],
        });

        const result = parser.parseWorkbook(workbook);

        expect(result.siteManagers.map((m) => [m.email, m.userType, m.rowNumber])).toEqual([
            ["local.manager@example.com", ParsedUserType.Local, 3],
            ["ext.manager@example.com", ParsedUserType.External, 4],
        ]);
        expect(result.siteAuditors[0].userType).toBe(ParsedUserType.External);
        expect(result.users.map((u) => u.userType)).toEqual([ParsedUserType.External, ParsedUserType.Local]);
    });

    it("finds the users type column by header, not by position", () => {
        const workbook = buildWorkbook({
            siteHeaders: LEGACY_SITE_HEADERS,
            siteRows: [row({ ...customerCells, "SITE MANAGER EMAIL": "m@example.com" }, LEGACY_SITE_HEADERS)],
            userHeaders: ["FIRST NAME", "LAST NAME", "EMAIL", "TEAM", "COMMENT", "user type"],
            userRows: [["Ext", "Tech", "ext.tech@example.com", "TEAM A", "anything", "EXTERNAL"]],
        });

        expect(parser.parseWorkbook(workbook).users[0].userType).toBe(ParsedUserType.External);
    });

    it("rejects an unknown type value with sheet, row, column and email", () => {
        const workbook = buildWorkbook({
            siteHeaders: LEGACY_SITE_HEADERS,
            siteRows: [row({ ...customerCells, "SITE MANAGER EMAIL": "m@example.com" }, LEGACY_SITE_HEADERS)],
            userHeaders: ["FIRST NAME", "LAST NAME", "EMAIL", "TEAM", "USER TYPE"],
            userRows: [
                ["Ok", "User", "ok@example.com", "TEAM A", "LOCAL"],
                ["Anna", "Entra", "anna@example.com", "TEAM A", "Entra"],
            ],
        });

        const error = captureValidationError(() => parser.parseWorkbook(workbook));

        expect(error.issues).toEqual([
            {
                sheet: "users",
                row: 3,
                column: "USER TYPE",
                message: 'invalid value "Entra" for anna@example.com. Allowed: LOCAL, EXTERNAL.',
            },
        ]);
    });

    it("rejects a type cell without an email", () => {
        const workbook = buildWorkbook({
            siteHeaders: TYPED_SITE_HEADERS,
            siteRows: [
                row({ ...customerCells, "SITE MANAGER EMAIL": "m@example.com" }, TYPED_SITE_HEADERS),
                row({ "SITE AUDITOR TYPE": "EXTERNAL" }, TYPED_SITE_HEADERS),
            ],
        });

        const error = captureValidationError(() => parser.parseWorkbook(workbook));

        expect(error.issues[0]).toEqual(
            jasmine.objectContaining({ sheet: "site", row: 4, column: "SITE AUDITOR TYPE" }),
        );
    });

    it("rejects one person with different types in two roles", () => {
        const workbook = buildWorkbook({
            siteHeaders: TYPED_SITE_HEADERS,
            siteRows: [
                row(
                    {
                        ...customerCells,
                        "SITE MANAGER EMAIL": "person@example.com",
                        "SITE MANAGER TYPE": "EXTERNAL",
                        "SITE AUDITOR EMAIL": "Person@Example.com",
                        "SITE AUDITOR TYPE": "LOCAL",
                    },
                    TYPED_SITE_HEADERS,
                ),
            ],
        });

        const error = captureValidationError(() => parser.parseWorkbook(workbook));

        expect(error.issues.length).toBe(1);
        expect(error.issues[0].column).toBe("SITE AUDITOR TYPE");
        expect(error.issues[0].message).toContain("One person has exactly one account type.");
    });

    it("merges identical duplicates and reports shared accounts as notices", () => {
        const workbook = buildWorkbook({
            siteHeaders: TYPED_SITE_HEADERS,
            siteRows: [
                row(
                    {
                        ...customerCells,
                        "SITE MANAGER EMAIL": "person@example.com",
                        "SITE MANAGER TYPE": "EXTERNAL",
                    },
                    TYPED_SITE_HEADERS,
                ),
                row(
                    { "SITE MANAGER EMAIL": "PERSON@example.com", "SITE MANAGER TYPE": "external" },
                    TYPED_SITE_HEADERS,
                ),
            ],
            userHeaders: ["FIRST NAME", "LAST NAME", "EMAIL", "TEAM", "USER TYPE"],
            userRows: [["P", "Erson", "person@example.com", "TEAM A", "EXTERNAL"]],
        });

        const result = parser.parseWorkbook(workbook);

        expect(result.siteManagers.length).toBe(1);
        expect(result.notices.length).toBe(2);
        expect(result.notices[0]).toContain("rows 3 and 4");
        expect(result.notices[1]).toContain("same BeyondTrust account (EXTERNAL)");
    });

    it("rejects a duplicate auditor with a different operator flag", () => {
        const workbook = buildWorkbook({
            siteHeaders: TYPED_SITE_HEADERS,
            siteRows: [
                row(
                    {
                        ...customerCells,
                        "SITE MANAGER EMAIL": "m@example.com",
                        "SITE AUDITOR EMAIL": "a@example.com",
                        "IS AUDITOR OPERATOR": "YES",
                    },
                    TYPED_SITE_HEADERS,
                ),
                row({ "SITE AUDITOR EMAIL": "a@example.com", "IS AUDITOR OPERATOR": "NO" }, TYPED_SITE_HEADERS),
            ],
        });

        const error = captureValidationError(() => parser.parseWorkbook(workbook));

        expect(error.issues[0]).toEqual(
            jasmine.objectContaining({ sheet: "site", row: 4, column: "IS AUDITOR OPERATOR" }),
        );
    });
});
