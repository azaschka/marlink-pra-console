import { Injectable } from "@angular/core";
import * as XLSX from "xlsx";
import { SiteUserConsolidation } from "./site-user-consolidation";

// CUSTOMER
export interface ParsedCustomer {
    key: string; // MARLINK CUSTOMER ID
    name: string; // CUSTOMER NAME
    businessUnit: string; // BUSINESS UNIT
}

// SITE
export interface ParsedSite {
    key: string; // MARLINK SITE ID
    name: string; // SITE NAME
}

// USER TYPE (R3.2-A003)
/**
 * Whether a person in the workbook has a local BeyondTrust account or one provisioned by an external identity
 * provider (for example Entra ID). Declared per user entry; never derived from the email domain.
 */
export enum ParsedUserType {
    Local = "LOCAL",
    External = "EXTERNAL",
}

// SITE AUDITORS
export interface ParsedSiteAuditor {
    email: string; // SITE AUDITOR EMAIL
    isAdminOperator: boolean; // IS AUDITOR OPERATOR ("YES"/"NO")
    userType: ParsedUserType; // SITE AUDITOR TYPE (optional column, default LOCAL)
    rowNumber: number; // Excel row number in the site sheet
}

// SITE MANAGERS
export interface ParsedSiteManager {
    email: string; // SITE MANAGER EMAIL
    userType: ParsedUserType; // SITE MANAGER TYPE (optional column, default LOCAL)
    rowNumber: number; // Excel row number in the site sheet
}

// SUPPORT TEAMS
export enum ParsedAccessLevel {
    Full = "full",
    Limited = "limited",
}
export enum ParsedTrustLevel {
    NoRestrictions = "no-restrictions",
    RequireAuth = "require-auth",
    NotifyOnly = "notify-only",
}
export interface ParsedSupportTeam {
    teamName: string; // TEAM_NAME
    accessLevel: ParsedAccessLevel; // ACCESS_LEVEL
    trustLevel: ParsedTrustLevel; // IS_TRUSTED
}

// USERS (Support Team Members)
export interface ParsedUser {
    firstName: string; // FIRST NAME
    lastName: string; // LAST NAME
    email: string; // EMAIL
    teamName: string; // TEAM
    userType: ParsedUserType; // USER TYPE (optional column, default LOCAL)
    rowNumber: number; // Excel row number in the users sheet
}

// JUMP ASSETS (Hosts)
export enum ParsedJumpItemType {
    JumpItem = "jump-item",
    JumpClient = "jump-client",
}
export enum ParsedJumpType {
    RemoteRdp = "remote-rdp",
    RemoteVnc = "remote-vnc",
    ShellJump = "shell-jump",
    WebJump = "web-jump",
    ProtocolTunnelJump = "protocol-tunnel-jump",
    WinNt32Msi = "winNT-32-msi",
    WinNt64Msi = "winNT-64-msi",
    MacOsxX86 = "mac-osx-x86",
    Linux32Armv7Headless = "linux32-armv7-headless",
    Linux64X86 = "linux64-x86",
    Linux64X86Headless = "linux64-x86-headless",
}
export interface ParsedJumpAsset {
    hostname: string; // IP ADDRESS
    name: string; // SYSTEM NAME
    jumpItemType: ParsedJumpItemType;
    jumpType: ParsedJumpType;
    port?: number; // PORT (optional)
    protocolType?: string; // either ssh or telnet
    comments?: string;
    teams: string[]; // L1 TEAM NAME, L2 TEAM NAME, ...
}

export interface SiteExcelParseResult {
    customer: ParsedCustomer;
    site: ParsedSite;
    siteAuditors: ParsedSiteAuditor[];
    siteManagers: ParsedSiteManager[];
    siteApprovers: string[];
    supportTeams: ParsedSupportTeam[];
    users: ParsedUser[];
    jumpAssets: ParsedJumpAsset[];
    /** Non-blocking findings for the preview, for example merged duplicate rows. */
    notices: string[];
}

/**
 * One blocking problem in the workbook, located precisely enough for the user to fix the cell.
 */
export interface SiteExcelIssue {
    sheet: string;
    row: number; // Excel row number
    column: string; // header name
    message: string;
}

/**
 * Raised when the workbook contains values that must be corrected before anything is sent to the PRA API.
 * The message lists every issue, one per line, so a single round trip is enough to fix the file.
 */
export class SiteExcelValidationError extends Error {
    constructor(public readonly issues: SiteExcelIssue[]) {
        super(SiteExcelValidationError.format(issues));
        this.name = "SiteExcelValidationError";
    }

    private static format(issues: SiteExcelIssue[]): string {
        const lines = issues.map(
            (issue) => `Sheet "${issue.sheet}", row ${issue.row}, column "${issue.column}": ${issue.message}`,
        );
        return `${issues.length} problem(s) found in the workbook:\n${lines.join("\n")}`;
    }
}

/**
 * Service for parsing site-related data from Excel files
 * Handles parsing of customers, sites, auditors, support teams, users, and jump assets
 */
@Injectable()
export class SiteExcelParserService {
    // Sheet names
    private static readonly SHEET_SITE = "site";
    private static readonly SHEET_SUPPORT_TEAMS = "support_teams";
    private static readonly SHEET_USERS = "users";
    private static readonly SHEET_HOSTS = "hosts";

    // Row indices for site sheet
    private static readonly SITE_SHEET_HEADER_ROW = 1;
    private static readonly SITE_SHEET_DATA_START_ROW = 2;

    // Row indices for other sheets
    private static readonly DEFAULT_HEADER_ROW = 0;
    private static readonly DEFAULT_DATA_START_ROW = 1;

    // Jump asset column indices
    private static readonly JUMP_ASSET_TEAMS_START_COL = 5;
    private static readonly JUMP_ASSET_TEAMS_END_COL = 11;

    // Header names for site sheet
    private static readonly HEADERS = {
        MARLINK_CUSTOMER_ID: "MARLINK CUSTOMER ID",
        CUSTOMER_NAME: "CUSTOMER NAME",
        BUSINESS_UNIT: "BUSINESS UNIT",
        MARLINK_SITE_ID: "MARLINK SITE ID",
        SITE_NAME: "SITE NAME",
        SITE_AUDITOR_EMAIL: "SITE AUDITOR EMAIL",
        IS_ADMIN_OPERATOR: "IS AUDITOR OPERATOR",
        SITE_MANAGER_EMAIL: "SITE MANAGER EMAIL",
        SITE_APPROVER_EMAIL: "SITE APPROVER EMAIL",
        SITE_AUDITOR_TYPE: "SITE AUDITOR TYPE",
        SITE_MANAGER_TYPE: "SITE MANAGER TYPE",
    };

    // Header of the optional user type column in the users sheet (located by name, not by position)
    private static readonly USERS_HEADER_USER_TYPE = "USER TYPE";

    /**
     * Parses an Excel file and extracts site-related data
     * @param file The Excel file to parse
     * @returns Promise resolving to parsed site data
     * @throws Error if file parsing fails or required sheets are missing
     */
    public parse(file: File): Promise<SiteExcelParseResult> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    if (!e.target?.result) {
                        throw new Error("Failed to read file");
                    }

                    const data = new Uint8Array(e.target.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });

                    resolve(this.parseWorkbook(workbook));
                } catch (err) {
                    if (err instanceof SiteExcelValidationError) {
                        reject(err);
                        return;
                    }
                    const errorMessage =
                        err instanceof Error ? err.message : "Unknown error occurred while parsing Excel file";
                    reject(new Error(`Excel parsing failed: ${errorMessage}`));
                }
            };

            reader.onerror = () => {
                reject(new Error("Failed to read Excel file"));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Parses an already loaded workbook. Separated from parse() so it can be tested without a FileReader.
     * @throws SiteExcelValidationError if user entries carry invalid or contradicting values
     */
    public parseWorkbook(workbook: XLSX.WorkBook): SiteExcelParseResult {
        this.validateWorkbook(workbook);

        const issues: SiteExcelIssue[] = [];

        const customer = this.parseCustomer(workbook);
        const site = this.parseSite(workbook);
        const siteAuditors = this.parseSiteAuditors(workbook, issues);
        const siteManagers = this.parseSiteManagers(workbook, issues);
        const siteApprovers = this.parseSiteApprovers(workbook);
        const supportTeams = this.parseSupportTeams(workbook);
        const users = this.parseUsers(workbook, issues);
        const jumpAssets = this.parseJumpAssets(workbook);

        const consolidation = SiteUserConsolidation.consolidate(siteAuditors, siteManagers, users);
        issues.push(...consolidation.issues);

        if (issues.length > 0) {
            throw new SiteExcelValidationError(issues);
        }

        return {
            customer,
            site,
            siteAuditors: consolidation.siteAuditors,
            siteManagers: consolidation.siteManagers,
            siteApprovers,
            supportTeams,
            users: consolidation.users,
            jumpAssets,
            notices: consolidation.notices,
        };
    }

    /**
     * Validates that the workbook contains all required sheets
     */
    private validateWorkbook(workbook: XLSX.WorkBook): void {
        const requiredSheets = [
            SiteExcelParserService.SHEET_SITE,
            SiteExcelParserService.SHEET_SUPPORT_TEAMS,
            SiteExcelParserService.SHEET_USERS,
            SiteExcelParserService.SHEET_HOSTS,
        ];

        const missingSheets = requiredSheets.filter((sheetName) => !workbook.Sheets[sheetName]);

        if (missingSheets.length > 0) {
            throw new Error(`Missing required sheet(s): ${missingSheets.join(", ")}`);
        }
    }

    /**
     * Reads a sheet and returns it as a 2D array
     */
    private readSheet(workbook: XLSX.WorkBook, sheetName: string): any[][] {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }
        return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    }

    /**
     * Converts a row index of readSheet() into the row number shown in Excel. sheet_to_json starts at the first
     * row of the used range and keeps blank rows (default for header: 1), so the offset is the range start.
     */
    private toExcelRowNumber(workbook: XLSX.WorkBook, sheetName: string, rowIndex: number): number {
        const ref = workbook.Sheets[sheetName]?.["!ref"];
        const firstRow = ref ? XLSX.utils.decode_range(ref).s.r : 0;
        return firstRow + rowIndex + 1;
    }

    /**
     * Reads an optional user type cell. An absent column or an empty cell means LOCAL, which is the behaviour of
     * templates that predate the column. Any other value than LOCAL or EXTERNAL is reported, never guessed.
     */
    private parseUserType(
        rawValue: string,
        location: { sheet: string; row: number; column: string; email: string },
        issues: SiteExcelIssue[],
    ): ParsedUserType {
        const normalized = this.sanitizeValue(rawValue).toUpperCase();

        if (normalized === "" || normalized === ParsedUserType.Local) {
            return ParsedUserType.Local;
        }
        if (normalized === ParsedUserType.External) {
            return ParsedUserType.External;
        }

        issues.push({
            sheet: location.sheet,
            row: location.row,
            column: location.column,
            message: `invalid value "${this.sanitizeValue(rawValue)}"${
                location.email ? ` for ${location.email}` : ""
            }. Allowed: LOCAL, EXTERNAL.`,
        });
        return ParsedUserType.Local;
    }

    /**
     * Parses customer information from the site sheet
     */
    private parseCustomer(workbook: XLSX.WorkBook): ParsedCustomer {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_SITE);
        const headers = sheet[SiteExcelParserService.SITE_SHEET_HEADER_ROW] as string[];
        const row = sheet[SiteExcelParserService.SITE_SHEET_DATA_START_ROW];

        if (!row) {
            throw new Error("Customer data row not found in site sheet");
        }

        return {
            key: this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.MARLINK_CUSTOMER_ID),
            name: this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.CUSTOMER_NAME),
            businessUnit: this.parseBusinessUnit(
                this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.BUSINESS_UNIT),
            ),
        };
    }

    /**
     * Parses site information from the site sheet
     */
    private parseSite(workbook: XLSX.WorkBook): ParsedSite {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_SITE);
        const headers = sheet[SiteExcelParserService.SITE_SHEET_HEADER_ROW] as string[];
        const row = sheet[SiteExcelParserService.SITE_SHEET_DATA_START_ROW];

        if (!row) {
            throw new Error("Site data row not found in site sheet");
        }

        return {
            key: this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.MARLINK_SITE_ID),
            name: this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.SITE_NAME),
        };
    }

    /**
     * Parses site auditors from the site sheet
     */
    private parseSiteAuditors(workbook: XLSX.WorkBook, issues: SiteExcelIssue[]): ParsedSiteAuditor[] {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_SITE);
        const headers = sheet[SiteExcelParserService.SITE_SHEET_HEADER_ROW] as string[];
        const result: ParsedSiteAuditor[] = [];

        for (let i = SiteExcelParserService.SITE_SHEET_DATA_START_ROW; i < sheet.length; i++) {
            const row = sheet[i] ?? [];
            const rowNumber = this.toExcelRowNumber(workbook, SiteExcelParserService.SHEET_SITE, i);
            const email = this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.SITE_AUDITOR_EMAIL);
            const rawType = this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.SITE_AUDITOR_TYPE);

            if (!email) {
                this.reportTypeWithoutEmail(rawType, rowNumber, SiteExcelParserService.HEADERS.SITE_AUDITOR_TYPE, issues);
                continue;
            }

            result.push({
                email,
                isAdminOperator: this.parseBoolean(
                    this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.IS_ADMIN_OPERATOR),
                ),
                userType: this.parseUserType(
                    rawType,
                    {
                        sheet: SiteExcelParserService.SHEET_SITE,
                        row: rowNumber,
                        column: SiteExcelParserService.HEADERS.SITE_AUDITOR_TYPE,
                        email,
                    },
                    issues,
                ),
                rowNumber,
            });
        }

        return result;
    }

    private reportTypeWithoutEmail(rawType: string, rowNumber: number, column: string, issues: SiteExcelIssue[]): void {
        if (!rawType) {
            return;
        }
        issues.push({
            sheet: SiteExcelParserService.SHEET_SITE,
            row: rowNumber,
            column,
            message: `a user type is set but the matching email cell is empty.`,
        });
    }

    /**
     * Parses site managers from the site sheet
     */
    private parseSiteManagers(workbook: XLSX.WorkBook, issues: SiteExcelIssue[]): ParsedSiteManager[] {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_SITE);
        const headers = sheet[SiteExcelParserService.SITE_SHEET_HEADER_ROW] as string[];
        const result: ParsedSiteManager[] = [];

        for (let i = SiteExcelParserService.SITE_SHEET_DATA_START_ROW; i < sheet.length; i++) {
            const row = sheet[i] ?? [];
            const rowNumber = this.toExcelRowNumber(workbook, SiteExcelParserService.SHEET_SITE, i);
            const email = this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.SITE_MANAGER_EMAIL);
            const rawType = this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.SITE_MANAGER_TYPE);

            if (!email) {
                this.reportTypeWithoutEmail(rawType, rowNumber, SiteExcelParserService.HEADERS.SITE_MANAGER_TYPE, issues);
                continue;
            }

            result.push({
                email,
                userType: this.parseUserType(
                    rawType,
                    {
                        sheet: SiteExcelParserService.SHEET_SITE,
                        row: rowNumber,
                        column: SiteExcelParserService.HEADERS.SITE_MANAGER_TYPE,
                        email,
                    },
                    issues,
                ),
                rowNumber,
            });
        }

        return result;
    }

    /**
     * Parses site approvers from the site sheet
     */
    private parseSiteApprovers(workbook: XLSX.WorkBook): string[] {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_SITE);
        const headers = sheet[SiteExcelParserService.SITE_SHEET_HEADER_ROW] as string[];
        const result: string[] = [];

        for (let i = SiteExcelParserService.SITE_SHEET_DATA_START_ROW; i < sheet.length; i++) {
            const row = sheet[i];
            const email = this.getValueByHeader(headers, row, SiteExcelParserService.HEADERS.SITE_APPROVER_EMAIL);

            if (email) {
                result.push(email);
            }
        }

        return result;
    }

    /**
     * Parses support teams from the support_teams sheet
     */
    private parseSupportTeams(workbook: XLSX.WorkBook): ParsedSupportTeam[] {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_SUPPORT_TEAMS);
        const result: ParsedSupportTeam[] = [];

        for (let i = SiteExcelParserService.DEFAULT_DATA_START_ROW; i < sheet.length; i++) {
            const row = sheet[i];
            if (row && row[0]) {
                result.push({
                    teamName: this.sanitizeValue(row[0]),
                    accessLevel: this.parseAccessLevel(row[1]),
                    trustLevel: this.parseTrustLevel(row[2]),
                });
            }
        }

        return result;
    }

    /**
     * Parses users from the users sheet
     */
    private parseUsers(workbook: XLSX.WorkBook, issues: SiteExcelIssue[]): ParsedUser[] {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_USERS);
        const result: ParsedUser[] = [];

        // Columns A to D stay positional for compatibility; the optional type column is located by its header,
        // so templates without it keep working and a generator may place it after column D.
        const headers = (sheet[SiteExcelParserService.DEFAULT_HEADER_ROW] ?? []).map((header) =>
            this.sanitizeValue(header).toUpperCase(),
        );
        const userTypeColumnIndex = headers.indexOf(SiteExcelParserService.USERS_HEADER_USER_TYPE);

        for (let i = SiteExcelParserService.DEFAULT_DATA_START_ROW; i < sheet.length; i++) {
            const row = sheet[i];
            if (row && row[0]) {
                const email = this.sanitizeValue(row[2]);
                const rowNumber = this.toExcelRowNumber(workbook, SiteExcelParserService.SHEET_USERS, i);
                const rawType = userTypeColumnIndex === -1 ? "" : this.sanitizeValue(row[userTypeColumnIndex]);

                result.push({
                    firstName: this.sanitizeValue(row[0]),
                    lastName: this.sanitizeValue(row[1]),
                    email,
                    teamName: this.sanitizeValue(row[3]),
                    userType: this.parseUserType(
                        rawType,
                        {
                            sheet: SiteExcelParserService.SHEET_USERS,
                            row: rowNumber,
                            column: SiteExcelParserService.USERS_HEADER_USER_TYPE,
                            email,
                        },
                        issues,
                    ),
                    rowNumber,
                });
            }
        }

        return result;
    }

    /**
     * Parses jump assets from the hosts sheet
     */
    private parseJumpAssets(workbook: XLSX.WorkBook): ParsedJumpAsset[] {
        const sheet = this.readSheet(workbook, SiteExcelParserService.SHEET_HOSTS);
        const result: ParsedJumpAsset[] = [];

        for (let i = SiteExcelParserService.DEFAULT_DATA_START_ROW; i < sheet.length; i++) {
            const row = sheet[i];
            // Jump Clients only need System Name (col 1), Protocol (col 2), and Team (col 5+)
            // Jump Items (hosts) need IP Address (col 0), System Name, and Protocol
            // So we validate on System Name (col 1) instead of IP Address
            if (row && row[1]) {
                const protocol = this.sanitizeValue(row[2]).toUpperCase();
                const port = row[3] ? parseInt(row[3], 10) : undefined;

                result.push({
                    hostname: this.sanitizeValue(row[0]),
                    name: this.sanitizeValue(row[1]),
                    jumpItemType: this.parseJumpItemType(protocol),
                    jumpType: this.parseJumpType(protocol),
                    port: isNaN(port!) ? undefined : port,
                    protocolType: this.parseProtocolType(protocol),
                    comments: row[4] ? this.sanitizeValue(row[4]) : undefined,
                    teams: this.extractTeams(row),
                });
            }
        }

        return result;
    }

    // --- Helper methods ---

    /**
     * Gets a value from a row by header name
     */
    private getValueByHeader(headers: string[], row: any[], headerName: string): string {
        const idx = headers.indexOf(headerName);
        return idx !== -1 && row[idx] !== undefined ? this.sanitizeValue(row[idx]) : "";
    }

    /**
     * Sanitizes a value by converting to string and trimming whitespace
     */
    private sanitizeValue(val: any): string {
        return val !== null && val !== undefined ? val.toString().trim() : "";
    }

    /**
     * Extracts the business unit code from a value like "MT (Maritime)" → "MT".
     * Takes the first whitespace-separated token, making it robust against
     * varying separator styles ("MT (Maritime)", "MT-Maritime", "MT Maritime", "MT").
     */
    private parseBusinessUnit(value: string): string {
        return value.trim().split(/\s+/)[0];
    }

    /**
     * Parses a boolean value from various formats (YES/NO, true/false, 1/0)
     */
    private parseBoolean(val: string): boolean {
        return val.toLowerCase() === "yes" || val.toLowerCase() === "true";
    }

    /**
     * Extracts team names from a row
     */
    private extractTeams(row: any[]): string[] {
        return row
            .slice(SiteExcelParserService.JUMP_ASSET_TEAMS_START_COL, SiteExcelParserService.JUMP_ASSET_TEAMS_END_COL)
            .filter((v): v is string => v !== null && v !== undefined && typeof v === "string" && v.trim() !== "")
            .map((s) => s.trim());
    }

    /**
     * Parses access level from string value
     */
    private parseAccessLevel(val: any): ParsedAccessLevel {
        const normalized = this.sanitizeValue(val).toLowerCase();
        return normalized.includes("full") ? ParsedAccessLevel.Full : ParsedAccessLevel.Limited;
    }

    /**
     * Parses trust level from string value
     */
    private parseTrustLevel(val: any): ParsedTrustLevel {
        const normalized = this.sanitizeValue(val)
            .toLowerCase()
            .replace(/[\s\-]/g, "");

        if (normalized.includes("notify")) {
            return ParsedTrustLevel.NotifyOnly;
        }
        if (normalized.includes("no")) {
            return ParsedTrustLevel.NoRestrictions;
        }

        return ParsedTrustLevel.RequireAuth;
    }

    /**
     * Parses jump item type from protocol string
     */
    private parseJumpItemType(protocol: string): ParsedJumpItemType {
        return protocol.startsWith("JUMP CLIENT") ? ParsedJumpItemType.JumpClient : ParsedJumpItemType.JumpItem;
    }

    /**
     * Parses jump type from protocol string
     */
    private parseJumpType(protocol: string): ParsedJumpType {
        const protocolMap: Record<string, ParsedJumpType> = {
            RDP: ParsedJumpType.RemoteRdp,
            VNC: ParsedJumpType.RemoteVnc,
            SSH: ParsedJumpType.ShellJump,
            TELNET: ParsedJumpType.ShellJump,
            "WEB INTERFACE": ParsedJumpType.WebJump,
            "PROTOCOL TUNNEL": ParsedJumpType.ProtocolTunnelJump,
        };

        // Check exact matches first
        if (protocolMap[protocol]) {
            return protocolMap[protocol];
        }

        // Check partial matches
        if (protocol.includes("WINDOWS X86")) {
            return ParsedJumpType.WinNt32Msi;
        }
        if (protocol.includes("WINDOWS X64")) {
            return ParsedJumpType.WinNt64Msi;
        }
        if (protocol.includes("MAC OS")) {
            return ParsedJumpType.MacOsxX86;
        }
        if (protocol.includes("PI OS HEADLESS")) {
            return ParsedJumpType.Linux32Armv7Headless;
        }
        if (protocol.includes("LINUX X64 HEADLESS")) {
            return ParsedJumpType.Linux64X86Headless;
        }
        if (protocol.includes("LINUX X64")) {
            return ParsedJumpType.Linux64X86;
        }

        // Default fallback
        return ParsedJumpType.RemoteRdp;
    }

    /**
     * Parses protocol type (ssh/telnet) from protocol string
     */
    private parseProtocolType(protocol: string): string | undefined {
        if (protocol === "SSH" || protocol === "TELNET") {
            return protocol.toLowerCase();
        }
        return undefined;
    }
}
