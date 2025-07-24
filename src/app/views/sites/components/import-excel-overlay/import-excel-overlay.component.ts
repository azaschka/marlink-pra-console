import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { NestedTreeControl } from "@angular/cdk/tree";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import {
    ParsedAccessLevel,
    ParsedCustomer,
    ParsedJumpAsset,
    ParsedSite,
    ParsedSiteAdministrator,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedTrustLevel,
    ParsedUser,
    SiteExcelParserService,
} from "app/shared/services/site-excel-parser.service";
import { SitesService } from "../../sites.service";

interface PreviewTreeNode {
    label: string;
    value?: string;
    children?: PreviewTreeNode[];
}

@Component({
    selector: "app-import-excel-overlay",
    templateUrl: "./import-excel-overlay.component.html",
    styleUrls: ["./import-excel-overlay.component.scss"],
})
export class ImportExcelOverlayComponent {
    public isLoading = false;
    public isHovering = false;
    public file?: File;
    public hasSuccessfullyParsed = false;
    public hasStartedImport = false;
    public hasCompletedImport = false;
    public parsedCustomer?: ParsedCustomer;
    public parsedSite?: ParsedSite;
    public parsedSiteAdministrators: ParsedSiteAdministrator[] = [];
    public parsedSiteManagers: ParsedSiteManager[] = [];
    public parsedSupportTeams: ParsedSupportTeam[] = [];
    public parsedUsers: ParsedUser[] = [];
    public parsedJumpAssets: ParsedJumpAsset[] = [];

    // Tree for preview
    public treeControl = new NestedTreeControl<PreviewTreeNode>(
        (node) => node.children
    );
    public dataSource = new MatTreeNestedDataSource<PreviewTreeNode>();

    constructor(
        public dialogRef: MatDialogRef<ImportExcelOverlayComponent>,
        private readonly sitesService: SitesService,
        private readonly errorDialog: ErrorDialogService,
        private readonly siteExcelParserService: SiteExcelParserService
    ) {}

    public onFileDropped(files: FileList) {
        if (files.length) {
            this.file = files[0];
            this.parseIngestionFile(this.file);
        }
    }

    public onFileInput(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files?.length) {
            this.file = target.files[0];
            this.parseIngestionFile(this.file);
        }
    }

    public close(): void {
        this.dialogRef.close();
    }

    public parseIngestionFile(file: File) {
        this.isLoading = true;
        this.siteExcelParserService
            .parse(file)
            .then((result) => {
                this.parsedCustomer = result.customer;
                this.parsedSite = result.site;
                this.parsedSiteAdministrators = result.siteAdministrators;
                this.parsedSiteManagers = result.siteManagers;
                this.parsedUsers = result.users;
                this.parsedSupportTeams = result.supportTeams.filter((team) =>
                    this.parsedUsers.some(
                        (user) => user.teamName === team.teamName
                    )
                );
                this.parsedJumpAssets = result.jumpAssets;

                // Prepare tree nodes for preview
                this.dataSource.data = this.buildPreviewTree();

                this.hasSuccessfullyParsed =
                    !!this.parsedSite &&
                    !!this.parsedCustomer &&
                    !!this.parsedSiteManagers.length;
            })
            .catch((err) => {
                this.errorDialog.show({
                    title: "Parsing Error",
                    message: err?.message || "Failed to parse the file",
                });
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    private buildPreviewTree(): PreviewTreeNode[] {
        // --- Site Administrators
        const adminNodes = this.parsedSiteAdministrators.map((a) => ({
            label: `${a.username} (${a.email})`,
            value: a.isAdminOperator
                ? "AdminOperator: Yes"
                : "AdminOperator: No",
        }));

        // --- Site Managers
        const managerNodes = this.parsedSiteManagers.map((m) => ({
            label: `${m.username} (${m.email})`,
        }));

        // --- Support Teams mit Mitgliedern
        const teamNodes = this.parsedSupportTeams.map((team) => {
            const members = this.parsedUsers.filter(
                (u) => u.teamName === team.teamName
            );

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

        // --- Jump Assets/Hosts
        const jumpNodes = this.parsedJumpAssets.map((asset) => ({
            label: `${asset.name} [${asset.hostname}]`,
            value: [
                ` – Type: ${asset.jumpType}`,
                asset.port ? `Port: ${asset.port}` : undefined,
                // asset.comments ? `Comments: ${asset.comments}` : undefined,
                // asset.teams && asset.teams.length
                //     ? `Teams: ${asset.teams.join(", ")}`
                //     : undefined,
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
                children: managerNodes,
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

    public hasChild = (_: number, node: PreviewTreeNode) =>
        !!node.children && node.children.length > 0;

    public async startImport() {
        this.isLoading = true;

        try {
            // Hier Site, Customer & Hosts wie besprochen importieren
            // await this.sitesService.createSite(this.mappedSite);
            this.dialogRef.close(true);
        } catch (err: any) {
            this.errorDialog.show({
                title: "Import Failed",
                message: err?.message || "Failed to import site",
            });
        } finally {
            this.isLoading = false;
        }
    }
}
