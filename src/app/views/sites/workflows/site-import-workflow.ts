import { Injectable } from "@angular/core";
import {
    ParsedCustomer,
    ParsedJumpAsset,
    ParsedJumpItemType,
    ParsedJumpType,
    ParsedSite,
    ParsedSiteAuditor,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedTrustLevel,
    ParsedUser,
} from "../../../shared/services/site-excel-parser.service";
import { Observable } from "rxjs";
import { CreateSiteDtoInput, ImportStatus, ImportStep, Site } from "../models";
import { ErrorUtils, StringSanitizer } from "../../../shared/helpers";

// Customer imports
import { CustomerFactory } from "../../customers/factories/customer.factory";
import { CustomersService } from "../../customers/customers.service";
import { Customer, CustomerCreateRequest } from "../../customers/models";

// Site imports
import { SiteFactory } from "../factories/site.factory";
import { SitesService } from "../sites.service";

// Jump Groups imports
import { JumpGroupsService } from "../../jump-groups/jump-groups.service";
import { JumpGroup } from "../../jump-groups/models";

// Jump Policies imports
import { JumpPoliciesService } from "../../jump-policies/jump-policies.service";
import { JumpPolicy } from "../../jump-policies/models";

// Jumpoints imports
import { JumpointsService } from "../../jumpoints/jumpoints.service";

// Jump Assets imports
import {
    CreateJumpClientInstallerDtoInput,
    CreateProtocolTunnelJumpDtoInput,
    CreateRemoteRdpDtoInput,
    CreateRemoteVncDtoInput,
    CreateShellJumpDtoInput,
    CreateWebJumpDtoInput,
} from "../../jump-assets/models";
import { JumpAssetsService } from "../../jump-assets/jump-assets.service";
import {
    JumpClientConnectionType,
    JumpClientGroupType,
    JumpGroupType,
    RdpQualityMode,
    ShellJumpProtocolType,
    ShellJumpTerminalType,
    TunnelType,
    WebJumpUsernameFormatType,
} from "../../jump-assets/enums";

export interface ImportWorkflowSummary {
    totalSteps: number;
    assetsCreated: number;
    assetsErrored: number;
    errors: {
        label: string;
        result: string;
    }[];
}

@Injectable({ providedIn: "root" })
export class SiteImportWorkflowService {
    private site: Site | undefined = undefined;
    private jumpGroups: JumpGroup[] = [];
    private jumpPolicies: JumpPolicy[] = [];

    // RESULT-OBJECT mit Steps und optional Summary
    private result: {
        steps: ImportStep[];
        summary?: ImportWorkflowSummary;
    } = { steps: [] };

    constructor(
        private readonly customersService: CustomersService,
        private readonly sitesService: SitesService,
        private readonly jumpGroupsService: JumpGroupsService,
        private readonly jumpPoliciesService: JumpPoliciesService,
        private readonly jumpAssetsService: JumpAssetsService,
        private readonly jumpointsService: JumpointsService,
    ) {}

    public startWorkflow(
        tenantId: number,
        parsed: {
            customer: ParsedCustomer;
            site: ParsedSite;
            siteAuditors: ParsedSiteAuditor[];
            siteManagers: ParsedSiteManager[];
            siteApprovers: string[];
            supportTeams: ParsedSupportTeam[];
            users: ParsedUser[];
            jumpAssets: ParsedJumpAsset[];
        },
        steps: ImportStep[],
    ): Observable<ImportStep[]> {
        // Reset result for this run
        this.result = { steps };
        return new Observable((sub) => {
            (async () => {
                // === 1. CREATE CUSTOMER ===
                steps.push({
                    label: "Creating Customer ...",
                    status: ImportStatus.InProgress,
                });
                sub.next([...steps]);
                // Build customer request
                const customerRequest = this.buildCustomerRequest(
                    tenantId,
                    parsed.customer,
                    steps[0],
                );
                if (!customerRequest) {
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[0].result);
                    return;
                }
                // Create customer
                await this.createCustomer(customerRequest, steps[0]);
                if (steps[0].status === ImportStatus.Error) {
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[0].result);
                    return;
                }
                sub.next([...steps]);

                // === 2. CREATE SITE ===
                steps.push({
                    label: "Creating Site ...",
                    status: ImportStatus.InProgress,
                });
                sub.next([...steps]);
                // Build site request
                const siteRequest = this.buildSiteRequest(
                    parsed.site,
                    customerRequest.key,
                    parsed.siteAuditors,
                    parsed.siteManagers,
                    parsed.siteApprovers,
                    parsed.supportTeams,
                    parsed.users,
                    steps[1],
                );
                if (!siteRequest) {
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[1].result);
                    return;
                }
                // Create site
                this.site = await this.createSite(siteRequest, steps[1]);
                if (steps[1].status === ImportStatus.Error) {
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[1].result);
                    return;
                }
                sub.next([...steps]);

                // === 3. FETCH GROUPS, POLICIES, JUMPOINTS ===
                // 3.1 JumpGroups
                steps.push({
                    label: "Creating/Updating site auditors and resolving JumpGroups ...",
                    status: ImportStatus.InProgress,
                });
                sub.next([...steps]);
                try {
                    this.jumpGroups =
                        await this.jumpGroupsService.fetchJumpGroups(tenantId);
                    steps[2].result =
                        "Site auditors created/updated and JumpGroups resolved.";
                    steps[2].status = ImportStatus.Success;
                } catch (err: any) {
                    steps[2].status = ImportStatus.Error;
                    steps[2].result = this.stringifyError(err);
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[2].result);
                    return;
                }
                sub.next([...steps]);
                // 3.2 JumpPolicies
                steps.push({
                    label: "Creating/Updating site managers and resolving JumpPolicies ...",
                    status: ImportStatus.InProgress,
                });
                sub.next([...steps]);
                try {
                    this.jumpPolicies =
                        await this.jumpPoliciesService.fetchJumpPolicies(
                            tenantId,
                        );
                    steps[3].result =
                        "Site managers created/updated and JumpPolicies resolved.";
                    steps[3].status = ImportStatus.Success;
                } catch (err: any) {
                    steps[3].status = ImportStatus.Error;
                    steps[3].result = this.stringifyError(err);
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[3].result);
                    return;
                }
                sub.next([...steps]);
                // 3.3 Jumpoints
                steps.push({
                    label: "Creating/Updating support teams and resolving Jumpoint ...",
                    status: ImportStatus.InProgress,
                });
                sub.next([...steps]);
                let jumpointId: number | undefined;
                try {
                    jumpointId = await this.resolveJumpointId(
                        tenantId,
                        parsed.customer,
                        parsed.site,
                    );
                    steps[4].result =
                        "Support teams created/updated and Jumpoint resolved.";
                    steps[4].status = ImportStatus.Success;
                } catch (err: any) {
                    steps[4].status = ImportStatus.Error;
                    steps[4].result = this.stringifyError(err);
                    sub.next([...steps]);
                    this.result.steps = [...steps];
                    this.result.summary = this.makeSummary(steps);
                    sub.error(steps[4].result);
                    return;
                }
                sub.next([...steps]);

                // === 4. CREATE JUMP ASSETS ===
                let createdAssets = 0,
                    erroredAssets = 0;
                for (const asset of parsed.jumpAssets) {
                    if (!asset.teams?.length) continue;
                    for (const teamName of asset.teams) {
                        const parsedTeam = parsed.supportTeams.find(
                            (t) => t.teamName === teamName,
                        );
                        if (!parsedTeam) continue;
                        const label = `Creating Host ${asset.name} ...`;
                        steps.push({ label, status: ImportStatus.InProgress });
                        const currentStepIdx = steps.length - 1;
                        sub.next([...steps]);
                        try {
                            const jumpAssetRequest =
                                this.createJumpAssetRequest(
                                    asset,
                                    parsed.customer,
                                    parsed.site,
                                    parsedTeam,
                                    jumpointId,
                                );
                            if (!jumpAssetRequest) {
                                steps[currentStepIdx].status =
                                    ImportStatus.Error;
                                steps[currentStepIdx].result =
                                    "Jump Asset creation failed (Jump Group or Jumpoint missing)";
                                erroredAssets++;
                                sub.next([...steps]);
                                continue;
                            }

                            if (
                                asset.jumpItemType ===
                                ParsedJumpItemType.JumpClient
                            ) {
                                await this.jumpAssetsService.createJumpClientInstaller(
                                    tenantId,
                                    jumpAssetRequest as CreateJumpClientInstallerDtoInput,
                                );
                            } else {
                                switch (asset.jumpType) {
                                    case ParsedJumpType.RemoteRdp:
                                        await this.jumpAssetsService.createRemoteRdp(
                                            tenantId,
                                            jumpAssetRequest as CreateRemoteRdpDtoInput,
                                        );
                                        break;
                                    case ParsedJumpType.RemoteVnc:
                                        await this.jumpAssetsService.createRemoteVnc(
                                            tenantId,
                                            jumpAssetRequest as CreateRemoteVncDtoInput,
                                        );
                                        break;
                                    case ParsedJumpType.ShellJump:
                                        await this.jumpAssetsService.createShellJump(
                                            tenantId,
                                            jumpAssetRequest as CreateShellJumpDtoInput,
                                        );
                                        break;
                                    case ParsedJumpType.WebJump:
                                        await this.jumpAssetsService.createWebJump(
                                            tenantId,
                                            jumpAssetRequest as CreateWebJumpDtoInput,
                                        );
                                        break;
                                    case ParsedJumpType.ProtocolTunnelJump:
                                        await this.jumpAssetsService.createProtocolTunnelJump(
                                            tenantId,
                                            jumpAssetRequest as CreateProtocolTunnelJumpDtoInput,
                                        );
                                        break;
                                    default:
                                        steps[currentStepIdx].status =
                                            ImportStatus.Error;
                                        steps[currentStepIdx].result =
                                            `Unknown jump type: ${asset.jumpType}`;
                                        console.warn(
                                            "[SiteImportWorkflow] Unknown jump type:",
                                            asset.jumpType,
                                        );
                                        erroredAssets++;
                                        sub.next([...steps]);
                                        continue;
                                }
                            }

                            steps[currentStepIdx].status = ImportStatus.Success;
                            steps[currentStepIdx].result =
                                `Created Host: ${asset.name} with Support Team: ${teamName}`;
                            createdAssets++;
                        } catch (err: any) {
                            if (err?.status === 409) {
                                steps[currentStepIdx].status =
                                    ImportStatus.Success;
                                const extractedMessages =
                                    ErrorUtils.extractMessages(err);
                                steps[currentStepIdx].result =
                                    extractedMessages[
                                        extractedMessages.length - 1
                                    ];
                            } else {
                                steps[currentStepIdx].status =
                                    ImportStatus.Error;
                                steps[currentStepIdx].result =
                                    this.stringifyError(err);
                            }
                            erroredAssets++;
                        }
                        sub.next([...steps]);
                    }
                }

                // === FERTIG ===
                this.result.steps = [...steps];
                this.result.summary = this.makeSummary(
                    steps,
                    createdAssets,
                    erroredAssets,
                );
                sub.complete();
            })();
        });
    }

    public getResult() {
        return this.result;
    }

    // ------- HELPERS -------

    private stringifyError(err: any): string {
        if (!err) return "Unknown error";
        if (typeof err === "string") return err;

        // Dig into nested HttpErrorResponse / API error body
        const body = err?.error ?? err;
        const deepest = this.extractDeepestMessage(body);
        if (deepest) return deepest;

        if (err.message) return err.message;
        try {
            return JSON.stringify(err);
        } catch {
            return String(err);
        }
    }

    /**
     * Recursively unwraps nested `message` objects until reaching the deepest
     * API error payload, then formats it as a human-readable string.
     * Example output: "web-jumps, Validation Failed, url: This value must be a valid URL."
     */
    private extractDeepestMessage(obj: any): string | null {
        if (!obj || typeof obj !== "object") return null;

        // Recurse into nested message
        if (obj.message && typeof obj.message === "object") {
            const deeper = this.extractDeepestMessage(obj.message);
            if (deeper) return deeper;
        }

        const parts: string[] = [];

        // Path: take last segment e.g. "/jump-items/web-jumps" → "web-jumps"
        if (typeof obj.path === "string") {
            const segment = obj.path.split("/").filter(Boolean).pop();
            if (segment) parts.push(segment);
        }

        // Top-level message string
        if (typeof obj.message === "string") {
            parts.push(obj.message);
        }

        // Validation errors: { field: ["msg1", "msg2"] }
        if (obj.errors && typeof obj.errors === "object") {
            for (const [field, messages] of Object.entries(obj.errors)) {
                const msgs = Array.isArray(messages)
                    ? messages.join("; ")
                    : String(messages);
                parts.push(`${field}: ${msgs}`);
            }
        }

        return parts.length > 0 ? parts.join(", ") : null;
    }

    private makeSummary(
        steps: ImportStep[],
        createdAssets = 0,
        erroredAssets = 0,
    ): ImportWorkflowSummary {
        return {
            totalSteps: steps.length,
            assetsCreated: createdAssets,
            assetsErrored: erroredAssets,
            errors: steps
                .filter(
                    (s) =>
                        s.status === ImportStatus.Error &&
                        s.result !== undefined,
                )
                .map((s) => ({
                    label: s.label,
                    result: s.result as string,
                })),
        };
    }

    private buildCustomerRequest(
        tenantId: number,
        parsedCustomer: ParsedCustomer,
        step: ImportStep,
    ): CustomerCreateRequest | undefined {
        try {
            return CustomerFactory.create(tenantId, parsedCustomer);
        } catch (err: any) {
            step.status = ImportStatus.Error;
            step.label = "Customer creation failed!";
            step.result = err.message || this.stringifyError(err);
            return undefined;
        }
    }

    private buildSiteRequest(
        site: ParsedSite,
        customerKey: string,
        siteAuditors: ParsedSiteAuditor[],
        siteManagers: ParsedSiteManager[],
        siteApprovers: string[],
        supportTeams: ParsedSupportTeam[],
        users: ParsedUser[],
        step: ImportStep,
    ): CreateSiteDtoInput | undefined {
        try {
            return SiteFactory.create(
                site,
                customerKey,
                siteAuditors,
                siteManagers,
                siteApprovers,
                supportTeams,
                users,
            );
        } catch (err: any) {
            step.status = ImportStatus.Error;
            step.label = "Site creation failed!";
            step.result = err.message || this.stringifyError(err);
            return undefined;
        }
    }

    private async createCustomer(
        customerRequest: CustomerCreateRequest,
        step: ImportStep,
    ): Promise<Customer | undefined> {
        try {
            const customer =
                await this.customersService.createCustomer(customerRequest);
            step.status = ImportStatus.Success;
            step.result = `Created customer: ${customer.name} (ID: ${customer.key})`;
            return customer;
        } catch (err: any) {
            if (err?.status === 409) {
                step.status = ImportStatus.Success;
                step.result = "Customer already exists.";
                return undefined;
            } else {
                step.status = ImportStatus.Error;
                step.label = "Customer creation failed!";
                step.result = this.stringifyError(err);
                return undefined;
            }
        }
    }

    private async createSite(
        siteRequest: CreateSiteDtoInput,
        step: ImportStep,
    ): Promise<Site | undefined> {
        try {
            const site = await this.sitesService.createSite(siteRequest);
            step.status = ImportStatus.Success;
            step.result = `Created site: ${site.name} (ID: ${site.id})`;
            return site;
        } catch (err: any) {
            if (err?.status === 409) {
                return await this.retrieveSite(siteRequest.key, step);
            } else {
                step.status = ImportStatus.Error;
                step.label = "Site creation failed!";
                step.result = this.stringifyError(err);
                return undefined;
            }
        }
    }

    private async retrieveSite(
        key: string,
        step: ImportStep,
    ): Promise<Site | undefined> {
        try {
            const existingSite = await this.sitesService.fetchSiteByKey(key);
            if (existingSite) {
                step.status = ImportStatus.Success;
                step.result = `Site already exists. (ID: ${existingSite.id})`;
                return existingSite;
            } else {
                step.status = ImportStatus.Error;
                step.result = "Site already exists, but could not retrieve it.";
                return undefined;
            }
        } catch (fetchErr: any) {
            step.status = ImportStatus.Error;
            step.result =
                "Site already exists, but fetching failed: " +
                this.stringifyError(fetchErr);
            return undefined;
        }
    }

    private createJumpAssetRequest(
        asset: ParsedJumpAsset,
        customer: ParsedCustomer,
        site: ParsedSite,
        team: ParsedSupportTeam,
        jumpointId: number | undefined,
    ):
        | CreateJumpClientInstallerDtoInput
        | CreateRemoteRdpDtoInput
        | CreateRemoteVncDtoInput
        | CreateShellJumpDtoInput
        | CreateWebJumpDtoInput
        | CreateProtocolTunnelJumpDtoInput
        | undefined {
        const siteTag = this.createSiteTag(customer, site);
        const jumpGroupId = this.getJumpGroupIdForSupportTeam(customer, team);
        if (!jumpGroupId) {
            console.error(
                "[SiteImportWorkflow] Failed to retrieve Jump Group ID.",
            );
            return;
        }

        const jumpPolicyId = this.getJumpPolicyIdForSupportTeam(
            customer,
            site,
            team,
        );
        if (!jumpPolicyId) {
            console.error(
                "[SiteImportWorkflow] Failed to retrieve Jump Policy ID.",
            );
            return;
        }

        if (!jumpointId) {
            console.error(
                "[SiteImportWorkflow] Failed to retrieve Jumpoint ID.",
            );
            return;
        }

        if (asset.jumpItemType === ParsedJumpItemType.JumpClient) {
            return {
                name: this.createJumpAssetName(asset),
                jumpGroupId: jumpGroupId,
                jumpGroupType: JumpClientGroupType.Shared,
                jumpPolicyId: jumpPolicyId,
                tag: siteTag,
                connectionType: JumpClientConnectionType.Active,
                comments: asset.comments,
                validDurationInMinutes: 20160,
                shouldElevateInstall: true,
                shouldElevatePrompt: true,
                canOverrideJumpGroup: false,
                canOverrideJumpPolicy: false,
                canOverrideName: false,
                canOverrideTag: false,
                canOverrideComments: false,
                canOverrideSessionPolicy: false,
            } as CreateJumpClientInstallerDtoInput;
        }

        switch (asset.jumpType) {
            case ParsedJumpType.RemoteRdp:
                return {
                    name: this.createJumpAssetName(asset),
                    jumpointId: jumpointId,
                    hostname: asset.hostname,
                    jumpGroupId: jumpGroupId,
                    jumpGroupType: JumpGroupType.Shared,
                    qualityMode: RdpQualityMode.Video,
                    mustStartNewConsoleSession: false,
                    mustIgnoreUntrustedServerCert: false,
                    tag: siteTag,
                    comments: asset.comments,
                    jumpPolicyId: jumpPolicyId,
                    isSessionForensicsEnabled: false,
                    sessionPolicyId: null,
                } as CreateRemoteRdpDtoInput;
            case ParsedJumpType.RemoteVnc:
                return {
                    name: this.createJumpAssetName(asset),
                    jumpointId: jumpointId,
                    hostname: asset.hostname,
                    jumpGroupId: jumpGroupId,
                    port: asset.port || 5900,
                    jumpGroupType: JumpGroupType.Shared,
                    tag: siteTag,
                    comments: asset.comments,
                    jumpPolicyId: jumpPolicyId,
                    sessionPolicyId: null,
                } as CreateRemoteVncDtoInput;
            case ParsedJumpType.WebJump:
                return {
                    name: this.createJumpAssetName(asset),
                    jumpointId: jumpointId,
                    url: asset.hostname,
                    jumpGroupId: jumpGroupId,
                    jumpGroupType: JumpGroupType.Shared,
                    usernameFormatType: WebJumpUsernameFormatType.Default,
                    mustVerifyCertificate: false, // Default to false
                    authenticationTimeoutInSeconds: 3,
                    tag: siteTag,
                    comments: asset.comments,
                    jumpPolicyId: jumpPolicyId,
                    usernameField: "",
                    passwordField: "",
                    submitField: "",
                    sessionPolicyId: null,
                };
            case ParsedJumpType.ShellJump:
                return {
                    name: this.createJumpAssetName(asset),
                    jumpointId: jumpointId,
                    hostname: asset.hostname,
                    jumpGroupId: jumpGroupId,
                    protocolType: asset.protocolType as ShellJumpProtocolType,
                    port:
                        asset.port ||
                        asset.protocolType === ShellJumpProtocolType.SSH
                            ? 22
                            : 23,
                    jumpGroupType: JumpGroupType.Shared,
                    terminalType: ShellJumpTerminalType.Xterm,
                    keepAliveIdleSessionInSeconds: 0,
                    tag: siteTag,
                    comments: asset.comments,
                    jumpPolicyId: jumpPolicyId,
                    sessionPolicyId: null,
                };
            case ParsedJumpType.ProtocolTunnelJump:
                return {
                    name: this.createJumpAssetName(asset),
                    jumpointId: jumpointId,
                    hostname: asset.hostname,
                    jumpGroupId: jumpGroupId,
                    jumpGroupType: JumpGroupType.Shared,
                    tunnelType: TunnelType.Tcp,
                    username: "",
                    database: "",
                    url: "",
                    caCertificates: "",
                    tag: siteTag,
                    comments: asset.comments,
                    jumpPolicyId: jumpPolicyId,
                    sessionPolicyId: null,
                };
            default:
                return;
        }
    }

    private getJumpGroupIdForSupportTeam(
        customer: ParsedCustomer,
        team: ParsedSupportTeam,
    ): number | undefined {
        const customerName = SiteImportWorkflowService.sanitizeString(
            customer.name,
        );
        const teamName = SiteImportWorkflowService.sanitizeString(
            team.teamName,
        );
        const jumpGroupName = `${customerName}_${teamName}`;
        const jumpGroup = this.jumpGroups.find(
            (group) => group.name.toLowerCase() === jumpGroupName.toLowerCase(),
        );

        return jumpGroup ? jumpGroup.id : undefined;
    }

    private getJumpPolicyIdForSupportTeam(
        customer: ParsedCustomer,
        site: ParsedSite,
        team: ParsedSupportTeam,
    ): number | undefined {
        const jumpPolicyName = this.composeJumpPolicyName(customer, site, team);
        const jumpPolicy = this.jumpPolicies.find(
            (policy) =>
                policy.displayName.toLowerCase() ===
                jumpPolicyName.toLowerCase(),
        );

        return jumpPolicy ? jumpPolicy.id : undefined;
    }

    private createJumpAssetName(asset: ParsedJumpAsset): string {
        // Create a jump asset name based on hostname and name uppercase
        // return `${asset.name.toUpperCase()} (${asset.hostname.toUpperCase()})`;
        return `${asset.name.toUpperCase()}`;
    }

    private createSiteTag(customer: ParsedCustomer, site: ParsedSite): string {
        const customerName = SiteImportWorkflowService.sanitizeString(
            customer.name,
        );
        const siteName = SiteImportWorkflowService.sanitizeString(site.name);

        return `${customerName}_${siteName}`;
    }

    private composeJumpointName(
        customer: ParsedCustomer,
        site: ParsedSite,
    ): string {
        const businessUnit = SiteImportWorkflowService.sanitizeString(
            customer.businessUnit,
        ).toUpperCase();
        const customerName = SiteImportWorkflowService.sanitizeString(
            customer.name,
        ).toUpperCase();
        const siteName = SiteImportWorkflowService.sanitizeString(
            site.name,
        ).toUpperCase();
        const siteKey = site.key.toUpperCase();
        return `${businessUnit}_JPOI1_${customerName}_${siteName}_${siteKey}`;
    }

    private async resolveJumpointId(
        tenantId: number,
        customer: ParsedCustomer,
        site: ParsedSite,
    ): Promise<number | undefined> {
        const jumpointName = this.composeJumpointName(customer, site);
        const jumpoints = await this.jumpointsService.fetchJumpoints(tenantId);
        const match = jumpoints.find(
            (j) => j.name.toUpperCase() === jumpointName.toUpperCase(),
        );
        return match?.id;
    }

    private composeJumpPolicyName(
        customer: ParsedCustomer,
        site: ParsedSite,
        team: ParsedSupportTeam,
    ): string {
        const jumpPolicySuffix =
            this.translateTeamTrustLevelToJumpPolicySuffix(team);
        const customerName = SiteImportWorkflowService.sanitizeString(
            customer.name,
        ).toUpperCase();
        const sanitizedSiteName = SiteImportWorkflowService.sanitizeString(
            site.name,
        ).toUpperCase();

        return `${customerName}_${sanitizedSiteName}_${site.key.toUpperCase()}_${jumpPolicySuffix}`;
    }

    private translateTeamTrustLevelToJumpPolicySuffix(
        team: ParsedSupportTeam,
    ): string {
        if (team.trustLevel === ParsedTrustLevel.NoRestrictions) {
            return "NOAUTH";
        } else if (team.trustLevel === ParsedTrustLevel.RequireAuth) {
            return "AUTH";
        } else {
            return "NOTIFY";
        }
    }

    /**
     * Sanitizes a string by replacing whitespace with underscores, removing special characters,and converting to uppercase.
     * @param value The string to sanitize.
     * @returns The sanitized string.
     */
    private static sanitizeString(value: string): string {
        let sanitizeString =
            StringSanitizer.replaceWhitespaceWithUnderscore(value);
        sanitizeString =
            StringSanitizer.replaceHyphensWithUnderscore(sanitizeString);
        sanitizeString =
            StringSanitizer.replaceSpecialCharacters(sanitizeString);
        sanitizeString =
            StringSanitizer.removeSpecialCharacters(sanitizeString);

        return sanitizeString;
    }
}
