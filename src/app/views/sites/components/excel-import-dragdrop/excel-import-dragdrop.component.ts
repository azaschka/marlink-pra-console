import { Component, Output, EventEmitter } from "@angular/core";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import {
    SiteExcelParserService,
    SiteExcelValidationError,
} from "../../../../shared/services/site-excel-parser.service";

@Component({
    selector: "app-excel-import-dragdrop",
    templateUrl: "./excel-import-dragdrop.component.html",
    styleUrls: ["./excel-import-dragdrop.component.scss"],
})
export class ExcelImportDragDropComponent {
    @Output() parsed = new EventEmitter<any>();
    isHovering = false;
    file?: File;

    constructor(
        private excelParser: SiteExcelParserService,
        private readonly errorDialog: ErrorDialogService
    ) {}

    public async onFileDropped(files: FileList) {
        if (files.length) {
            this.file = files[0];
            await this.parseFile(this.file);
        }
    }

    public async onFileInput(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files?.length) {
            this.file = target.files[0];
            await this.parseFile(this.file);
        }
    }

    public async parseFile(file: File) {
        try {
            const data = await this.excelParser.parse(file);
            this.parsed.emit(data);
        } catch (err: any) {
            if (err instanceof SiteExcelValidationError) {
                this.errorDialog.show({
                    title: "Please correct the workbook",
                    message: ExcelImportDragDropComponent.formatIssues(err),
                });
                return;
            }
            this.errorDialog.show({
                title: "Excel Parsing Error",
                message:
                    err?.message ||
                    "An error occurred while parsing the Excel file.",
            });
        }
    }

    /** The dialog renders HTML; workbook values are escaped because they are user input. */
    private static formatIssues(error: SiteExcelValidationError): string {
        const escape = (value: string | number) =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
        const lines = error.issues.map(
            (issue) =>
                `<li>Sheet <strong>${escape(issue.sheet)}</strong>, row ${escape(issue.row)}, column <strong>${escape(
                    issue.column,
                )}</strong>: ${escape(issue.message)}</li>`,
        );
        return `Nothing was imported. ${error.issues.length} problem(s) found:<ul>${lines.join("")}</ul>`;
    }
}
