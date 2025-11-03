import { Component, Input } from "@angular/core";
import { ImportStep } from "../../models";

@Component({
    selector: "app-excel-import-progress",
    templateUrl: "./excel-import-progress.component.html",
})
export class ExcelImportProgressComponent {
    @Input() steps: ImportStep[] = [];
}
