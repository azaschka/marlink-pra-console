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
import { ImportExcelOverlayComponent } from "./components/import-excel-overlay/import-excel-overlay.component";
import { SitesComponent } from "./sites.component";

const COMPONENTS = [SitesComponent, ImportExcelOverlayComponent];

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
    providers: [SitesService],
})
export class SitesModule {}
