import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { SharedModule } from "../../shared/shared.module";
import { BtDiscrepanciesService } from "./bt-discrepancies.service";
import { BtDiscrepanciesComponent } from "./bt-discrepancies.component";
import { BtDiscrepanciesRoutes } from "./bt-discrepancies.routes";

const COMPONENTS = [BtDiscrepanciesComponent];

const SERVICES = [BtDiscrepanciesService];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        TranslateModule,
        SharedMaterialModule,
        SharedModule,
        RouterModule.forChild(BtDiscrepanciesRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class BtDiscrepanciesModule {}
