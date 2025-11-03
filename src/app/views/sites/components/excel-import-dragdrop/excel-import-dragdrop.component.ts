import { Component, Output, EventEmitter } from "@angular/core";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { SiteExcelParserService } from "../../../../shared/services/site-excel-parser.service";

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
            this.errorDialog.show({
                title: "Excel Parsing Error",
                message:
                    err?.message ||
                    "An error occurred while parsing the Excel file.",
            });
        }
    }
}
