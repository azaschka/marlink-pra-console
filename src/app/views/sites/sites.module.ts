import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { SitesRoutes } from "./sites.routing";
import { SitesService } from "./sites.service";
import { SiteImportWorkflowService } from "./workflows/site-import-workflow";
import { CustomersService } from "../customers/customers.service";
import { JumpAssetsService } from "../jump-assets/jump-assets.service";
import { JumpGroupsService } from "../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../jump-policies/jump-policies.service";
import { JumpointsService } from "../jumpoints/jumpoints.service";
import { ImportExcelOverlayComponent } from "./components/import-excel-overlay/import-excel-overlay.component";
import { ExcelImportDragDropComponent } from "./components/excel-import-dragdrop/excel-import-dragdrop.component";
import { ExcelImportPreviewComponent } from "./components/excel-import-preview/excel-import-preview.component";
import { ExcelImportProgressComponent } from "./components/excel-import-progress/excel-import-progress.component";
import { ExcelImportResultComponent } from "./components/excel-import-result/excel-import-result.component";
import { SitesComponent } from "./sites.component";

const COMPONENTS = [
    SitesComponent,
    ImportExcelOverlayComponent,
    ExcelImportDragDropComponent,
    ExcelImportPreviewComponent,
    ExcelImportProgressComponent,
    ExcelImportResultComponent,
];

const SERVICES = [
    SitesService,
    SiteImportWorkflowService,
    CustomersService,
    JumpAssetsService,
    JumpGroupsService,
    JumpPoliciesService,
    JumpointsService,
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        TranslateModule,
        SharedMaterialModule,
        SharedModule,
        CsvModule,
        RouterModule.forChild(SitesRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class SitesModule {}
