import { Component } from "@angular/core";
import {
    ParsedCustomer,
    ParsedJumpAsset,
    ParsedSite,
    ParsedSiteAuditor,
    ParsedSiteManager,
    ParsedSupportTeam,
    ParsedUser,
} from "app/shared/services/site-excel-parser.service";
import { SiteImportWorkflowService } from "../../workflows/site-import-workflow";
import { ImportState, ImportStep } from "../../models";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "app-import-excel-overlay",
    templateUrl: "./import-excel-overlay.component.html",
    styleUrls: ["./import-excel-overlay.component.scss"],
})
export class ImportExcelOverlayComponent {
    public isLoading = false;
    public importState: ImportState = ImportState.Idle;
    public importSteps: ImportStep[] = [];
    public previewData:
        | {
              customer: ParsedCustomer;
              site: ParsedSite;
              siteAuditors: ParsedSiteAuditor[];
              siteManagers: ParsedSiteManager[];
              siteApprovers: string[];
              supportTeams: ParsedSupportTeam[];
              users: ParsedUser[];
              jumpAssets: ParsedJumpAsset[];
          }
        | undefined;
    public importResult?: any;
    public hasError = false;

    constructor(
        public dialogRef: MatDialogRef<ImportExcelOverlayComponent>,
        public workflow: SiteImportWorkflowService
    ) {}

    public get headline(): string {
        switch (this.importState) {
            case "idle":
                return "Import from Excel";
            case "preview":
                return "Import Data Preview";
            case "importing":
                return "Importing Data …";
            case "success":
                return "Import Finished!";
            case "error":
                return "Import Failed!";
            default:
                return "Import from Excel";
        }
    }

    public close(): void {
        this.dialogRef.close(false);
    }

    // Triggered when DragDrop/Upload finishes parsing
    public async onExcelParsed(data: any): Promise<void> {
        this.previewData = data;
        this.importState = ImportState.Preview;
    }

    public async startImport(tenantId: number): Promise<void> {
        if (!this.previewData) return;
        this.importSteps = [];
        this.importResult = undefined;
        this.hasError = false;
        this.importState = ImportState.Importing;
        this.workflow
            .startWorkflow(tenantId, this.previewData, this.importSteps)
            .subscribe({
                next: (steps) => (this.importSteps = [...steps]),
                error: (err) => {
                    this.importResult = this.workflow.getResult();
                    this.hasError = true;
                    this.importState = ImportState.Error;
                },
                complete: () => {
                    this.importResult = this.workflow.getResult();
                    this.importState = ImportState.Success;
                },
            });
    }

    public reset(result: boolean): void {
        this.importState = ImportState.Idle;
        this.importSteps = [];
        this.previewData = undefined;
        this.importResult = undefined;
        this.hasError = false;

        this.dialogRef.close(result);
    }
}
