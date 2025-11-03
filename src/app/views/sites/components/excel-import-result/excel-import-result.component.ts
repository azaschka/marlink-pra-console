import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "app-excel-import-result",
    templateUrl: "./excel-import-result.component.html",
    styleUrls: ["./excel-import-result.component.scss"],
})
export class ExcelImportResultComponent {
    @Input() result: any;
    @Input() error?: string;
    @Output() reset = new EventEmitter<boolean>();
}
