import { Injectable } from "@angular/core";
import * as XLSX from "xlsx";

// CUSTOMER
export interface ParsedCustomer {
    key: string; // MARLINK CUSTOMER ID
    name: string; // CUSTOMER NAME
}

// SITE
export interface ParsedSite {
    key: string; // MARLINK SITE ID
    name: string; // SITE NAME
}

// SITE ADMINS
export interface ParsedSiteAdministrator {
    username: string; // SITE ADMINISTRATOR USERNAME
    email: string; // SITE ADMINISTRATOR EMAIL
    isAdminOperator: boolean; // IS ADMIN OPERATOR ("YES"/"NO")
}

// SITE MANAGERS
export interface ParsedSiteManager {
    username: string; // SITE MANAGER USERNAME
    email: string; // SITE MANAGER EMAIL
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
    siteAdministrators: ParsedSiteAdministrator[];
    siteManagers: ParsedSiteManager[];
    supportTeams: ParsedSupportTeam[];
    users: ParsedUser[];
    jumpAssets: ParsedJumpAsset[];
}

@Injectable()
export class SiteExcelParserService {
    public parse(file: File): Promise<SiteExcelParseResult> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });

                    const customer = this.parseCustomer(workbook);
                    const site = this.parseSite(workbook);
                    const siteAdministrators =
                        this.parseSiteAdministrators(workbook);
                    const siteManagers = this.parseSiteManagers(workbook);
                    const supportTeams = this.parseSupportTeams(workbook);
                    const users = this.parseUsers(workbook);
                    const jumpAssets = this.parseJumpAssets(workbook);

                    resolve({
                        customer,
                        site,
                        siteAdministrators,
                        siteManagers,
                        supportTeams,
                        users,
                        jumpAssets,
                    });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    private parseCustomer(workbook: XLSX.WorkBook): ParsedCustomer {
        const sheet = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["site"], {
            header: 1,
        });
        const headers = sheet[1] as string[];
        const row = sheet[2] as any[];

        return {
            key: this.valueByHeader(headers, row, "MARLINK CUSTOMER ID"),
            name: this.valueByHeader(headers, row, "CUSTOMER NAME"),
        };
    }

    private parseSite(workbook: XLSX.WorkBook): ParsedSite {
        const sheet = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["site"], {
            header: 1,
        });
        const headers = sheet[1] as string[];
        const row = sheet[2] as any[];

        return {
            key: this.valueByHeader(headers, row, "MARLINK SITE ID"),
            name: this.valueByHeader(headers, row, "SITE NAME"),
        };
    }

    private parseSiteAdministrators(
        workbook: XLSX.WorkBook
    ): ParsedSiteAdministrator[] {
        const sheet = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["site"], {
            header: 1,
        });
        const headers = sheet[1] as string[];
        const result: ParsedSiteAdministrator[] = [];

        for (let i = 2; i < sheet.length; i++) {
            const row = sheet[i];
            if (
                this.valueByHeader(headers, row, "SITE ADMINISTRATOR USERNAME")
            ) {
                result.push({
                    username: this.valueByHeader(
                        headers,
                        row,
                        "SITE ADMINISTRATOR USERNAME"
                    ),
                    email: this.valueByHeader(
                        headers,
                        row,
                        "SITE ADMINISTRATOR EMAIL"
                    ),
                    isAdminOperator:
                        (
                            this.valueByHeader(
                                headers,
                                row,
                                "IS ADMIN OPERATOR"
                            ) || ""
                        )
                            .toString()
                            .toLowerCase() === "yes",
                });
            }
        }

        return result;
    }

    private parseSiteManagers(workbook: XLSX.WorkBook): ParsedSiteManager[] {
        const sheet = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets["site"], {
            header: 1,
        });
        const headers = sheet[1] as string[];
        const result: ParsedSiteManager[] = [];

        for (let i = 2; i < sheet.length; i++) {
            const row = sheet[i];

            if (this.valueByHeader(headers, row, "SITE MANAGER USERNAME")) {
                result.push({
                    username: this.valueByHeader(
                        headers,
                        row,
                        "SITE MANAGER USERNAME"
                    ),
                    email: this.valueByHeader(
                        headers,
                        row,
                        "SITE MANAGER EMAIL"
                    ),
                });
            }
        }

        return result;
    }

    private parseSupportTeams(workbook: XLSX.WorkBook): ParsedSupportTeam[] {
        const sheet = XLSX.utils.sheet_to_json<any[]>(
            workbook.Sheets["support_teams"],
            { header: 1 }
        );
        const headers = sheet[0] as string[];
        const result: ParsedSupportTeam[] = [];

        for (let i = 1; i < sheet.length; i++) {
            const row = sheet[i];
            if (row && row[0]) {
                result.push({
                    teamName: row[0],
                    accessLevel: this.parseAccessLevel(row[1]),
                    trustLevel: this.parseTrustLevel(row[2]),
                });
            }
        }

        return result;
    }

    private parseUsers(workbook: XLSX.WorkBook): ParsedUser[] {
        const sheet = XLSX.utils.sheet_to_json<any[]>(
            workbook.Sheets["users"],
            { header: 1 }
        );
        const headers = sheet[0] as string[];
        const result: ParsedUser[] = [];

        for (let i = 1; i < sheet.length; i++) {
            const row = sheet[i];
            if (row && row[0]) {
                result.push({
                    firstName: row[0],
                    lastName: row[1],
                    email: row[2],
                    teamName: row[3],
                });
            }
        }

        return result;
    }

    private parseJumpAssets(workbook: XLSX.WorkBook): ParsedJumpAsset[] {
        const sheet = XLSX.utils.sheet_to_json<any[]>(
            workbook.Sheets["hosts"],
            { header: 1 }
        );
        const headers = sheet[0] as string[];
        const result: ParsedJumpAsset[] = [];

        for (let i = 1; i < sheet.length; i++) {
            const row = sheet[i];
            if (row && row[0]) {
                const protocol = (row[2] || "").toString().toUpperCase();
                const jumpAsset = {
                    hostname: row[0],
                    name: row[1],
                    jumpItemType: this.parseJumpItemType(row[2]),
                    jumpType: this.parseJumpType(row[2]),
                    port: row[3] ? parseInt(row[3], 10) : undefined,
                    protocolType: this.parseProtocolType(row[2]),
                    comments: row[4] || undefined,
                    teams: [row[5], row[6]].filter(Boolean),
                };
                result.push(jumpAsset as ParsedJumpAsset);
            }
        }

        return result;
    }

    // --- Helper methods ---
    private valueByHeader(
        headers: string[],
        row: any[],
        headerName: string
    ): string {
        const idx = headers.indexOf(headerName);

        return idx !== -1 && row[idx] !== undefined
            ? row[idx].toString().trim()
            : "";
    }

    private parseAccessLevel(val: string): ParsedAccessLevel {
        return (val || "").toLowerCase().includes("full")
            ? ParsedAccessLevel.Full
            : ParsedAccessLevel.Limited;
    }

    private parseTrustLevel(val: string): ParsedTrustLevel {
        const v = (val || "")
            .toString()
            .toLowerCase()
            .replace(/[\s\-]/g, "");

        if (v.includes("no")) return ParsedTrustLevel.NoRestrictions;
        if (v.includes("notify")) return ParsedTrustLevel.NotifyOnly;

        return ParsedTrustLevel.RequireAuth;
    }

    private parseJumpItemType(val: string): ParsedJumpItemType {
        const s = (val || "").toString().toUpperCase();

        if (s.startsWith("JUMP CLIENT")) return ParsedJumpItemType.JumpClient;

        return ParsedJumpItemType.JumpItem;
    }

    private parseJumpType(val: string): ParsedJumpType {
        const v = (val || "").toString().toUpperCase();

        if (v === "RDP") return ParsedJumpType.RemoteRdp;
        if (v === "VNC") return ParsedJumpType.RemoteVnc;
        if (v === "SSH" || v === "TELNET") return ParsedJumpType.ShellJump;
        if (v === "WEB INTERFACE") return ParsedJumpType.WebJump;
        if (v.includes("WINDOWS X86")) return ParsedJumpType.WinNt32Msi;
        if (v.includes("WINDOWS X64")) return ParsedJumpType.WinNt64Msi;
        if (v.includes("MAC OS")) return ParsedJumpType.MacOsxX86;
        if (v.includes("PI OS HEADLESS"))
            return ParsedJumpType.Linux32Armv7Headless;
        if (v.includes("LINUX X64 HEADLESS"))
            return ParsedJumpType.Linux64X86Headless;
        if (v.includes("LINUX X64")) return ParsedJumpType.Linux64X86;

        return ParsedJumpType.RemoteRdp;
    }

    private parseProtocolType(val: string): string | undefined {
        const v = (val || "").toString().toUpperCase();

        if (v === "SSH" || v === "TELNET") {
            return v.toLowerCase();
        }

        return undefined;
    }
}
