import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import {
    ParsedCustomer,
    ParsedJumpAsset,
    ParsedSite,
    ParsedSiteAuditor,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedUser,
    ParsedUserType,
} from "../../../../shared/services/site-excel-parser.service";
import { NestedTreeControl } from "@angular/cdk/tree";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { AppService } from "app/app.service";
import { BeyondtrustInstance } from "app/views/dashboard/components/beyondtrust-instaces/models";
import { JwtAuthService } from "app/shared/services/auth/jwt-auth.service";
import { AuthRole } from "app/shared/enums";

interface PreviewTreeNode {
    label: string;
    value?: string;
    children?: PreviewTreeNode[];
}

// Typisiere Preview-Daten
type ExcelImportPreviewData = {
    customer: ParsedCustomer;
    site: ParsedSite;
    siteAuditors: ParsedSiteAuditor[];
    siteManagers: ParsedSiteManager[];
    siteApprovers?: string[];
    supportTeams: ParsedSupportTeam[];
    users: ParsedUser[];
    jumpAssets: ParsedJumpAsset[];
    notices?: string[];
};

@Component({
    selector: "app-excel-import-preview",
    templateUrl: "./excel-import-preview.component.html",
    styleUrls: ["./excel-import-preview.component.scss"],
})
export class ExcelImportPreviewComponent implements OnInit {
    private _preview?: ExcelImportPreviewData;
    @Input()
    set preview(value: ExcelImportPreviewData | undefined) {
        this._preview = value;
        if (this._preview) {
            this.dataSource.data = this.buildPreviewTree();
        } else {
            this.dataSource.data = [];
        }
    }
    get preview(): ExcelImportPreviewData | undefined {
        return this._preview;
    }

    @Output() startImport = new EventEmitter<number>();

    public instances: BeyondtrustInstance[] = [];
    public selectedInstanceId: number | null = null;

    public treeControl = new NestedTreeControl<PreviewTreeNode>(
        (node) => node.children,
    );
    public dataSource = new MatTreeNestedDataSource<PreviewTreeNode>();

    public hasChild = (_: number, node: PreviewTreeNode) =>
        !!node.children && node.children.length > 0;

    constructor(
        private readonly appService: AppService,
        private readonly jwtAuthService: JwtAuthService,
    ) {}

    public async ngOnInit(): Promise<void> {
        await this.appService.initialize();
        const allInstances = this.appService.getInstances();
        const user = this.jwtAuthService.getPraUser();
        this.instances =
            !user || user.role === AuthRole.SUPER_ADMIN
                ? allInstances
                : allInstances.filter(
                      (i) =>
                          i.businessUnit === null ||
                          i.businessUnit === user.businessUnit,
                  );
        this.selectedInstanceId = this.appService.getSelectedInstanceId();
    }

    public onStartImport(): void {
        if (this.selectedInstanceId) {
            this.startImport.emit(this.selectedInstanceId);
        }
    }

    /** LOCAL users get a local BeyondTrust account; EXTERNAL users must already exist (first login done). */
    private typeLabel(userType: ParsedUserType | undefined): string {
        return userType === ParsedUserType.External ? "Type: External" : "Type: Local";
    }

    private buildPreviewTree(): PreviewTreeNode[] {
        if (!this.preview) return [];
        const {
            siteAuditors = [],
            siteManagers = [],
            siteApprovers = [],
            supportTeams = [],
            users = [],
            jumpAssets = [],
        } = this.preview;

        // Site Auditors
        const auditorNodes = siteAuditors.map((a) => ({
            label: a.email,
            value: `${a.isAdminOperator ? "AdminOperator: Yes" : "AdminOperator: No"} | ${this.typeLabel(a.userType)}`,
        }));

        // Site Managers
        const managerNodes = siteManagers.map((m) => ({
            label: m.email,
            value: this.typeLabel(m.userType),
        }));

        const approverNodes = siteApprovers.map((approver) => ({
            label: approver,
        }));

        const parsedSupportTeams = supportTeams.filter((team) =>
            users.some((user) => user.teamName === team.teamName),
        );
        // Support Teams (mit Membern als Kindknoten)
        const teamNodes = parsedSupportTeams.map((team) => {
            const members = users.filter((u) => u.teamName === team.teamName);

            return {
                label: `${team.teamName}`,
                value: `(Access: ${team.accessLevel}, Trust: ${team.trustLevel})`,
                children: members.length
                    ? members.map((m) => ({
                          label: `${m.firstName} ${m.lastName}`,
                          value: `(Email: ${m.email}, ${this.typeLabel(m.userType)})`,
                      }))
                    : [{ label: "No users assigned", value: "", children: [] }],
            };
        });

        // Jump Assets/Hosts
        const jumpNodes = jumpAssets.map((asset) => ({
            label: `${asset.name} [${asset.hostname}]`,
            value: [
                `– Type: ${asset.jumpType}`,
                asset.port ? `Port: ${asset.port}` : undefined,
            ]
                .filter(Boolean)
                .join(" | "),
        }));

        const notices = this.preview.notices ?? [];

        return [
            ...(notices.length
                ? [
                      {
                          label: `Notices (${notices.length})`,
                          children: notices.map((notice) => ({ label: notice })),
                      },
                  ]
                : []),
            {
                label: "Site Auditors",
                children: auditorNodes.length
                    ? auditorNodes
                    : [{ label: "None" }],
            },
            {
                label: "Site Managers",
                children: managerNodes.length
                    ? managerNodes
                    : [{ label: "None" }],
            },
            {
                label: "Site Approvers",
                children: approverNodes.length
                    ? approverNodes
                    : [{ label: "None" }],
            },
            {
                label: "Support Teams",
                children: teamNodes.length ? teamNodes : [{ label: "None" }],
            },
            {
                label: "Jump Assets (Hosts)",
                children: jumpNodes.length ? jumpNodes : [{ label: "None" }],
            },
        ];
    }
}
