import { Component, Input, Output, EventEmitter } from "@angular/core";
import {
    ParsedCustomer,
    ParsedJumpAsset,
    ParsedSite,
    ParsedSiteAdministrator,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedUser,
} from "../../../../shared/services/site-excel-parser.service";
import { NestedTreeControl } from "@angular/cdk/tree";
import { MatTreeNestedDataSource } from "@angular/material/tree";

interface PreviewTreeNode {
    label: string;
    value?: string;
    children?: PreviewTreeNode[];
}

// Typisiere Preview-Daten
type ExcelImportPreviewData = {
    customer: ParsedCustomer;
    site: ParsedSite;
    siteAdministrators: ParsedSiteAdministrator[];
    siteManagers: ParsedSiteManager[];
    siteApprovers?: string[];
    supportTeams: ParsedSupportTeam[];
    users: ParsedUser[];
    jumpAssets: ParsedJumpAsset[];
};

@Component({
    selector: "app-excel-import-preview",
    templateUrl: "./excel-import-preview.component.html",
    styleUrls: ["./excel-import-preview.component.scss"],
})
export class ExcelImportPreviewComponent {
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

    @Output() startImport = new EventEmitter<void>();

    public treeControl = new NestedTreeControl<PreviewTreeNode>(
        (node) => node.children
    );
    public dataSource = new MatTreeNestedDataSource<PreviewTreeNode>();

    public hasChild = (_: number, node: PreviewTreeNode) =>
        !!node.children && node.children.length > 0;

    private buildPreviewTree(): PreviewTreeNode[] {
        if (!this.preview) return [];
        const {
            siteAdministrators = [],
            siteManagers = [],
            siteApprovers = [],
            supportTeams = [],
            users = [],
            jumpAssets = [],
        } = this.preview;

        // Site Admins
        const adminNodes = siteAdministrators.map((a) => ({
            label: `${a.username} (${a.email})`,
            value: a.isAdminOperator
                ? "AdminOperator: Yes"
                : "AdminOperator: No",
        }));

        // Site Managers
        const managerNodes = siteManagers.map((m) => ({
            label: `${m.username} (${m.email})`,
        }));

        const approverNodes = siteApprovers.map((approver) => ({
            label: approver,
        }));

        const parsedSupportTeams = supportTeams.filter((team) =>
            users.some((user) => user.teamName === team.teamName)
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
                          value: `(Email: ${m.email})`,
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

        return [
            {
                label: "Site Administrators",
                children: adminNodes.length ? adminNodes : [{ label: "None" }],
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
