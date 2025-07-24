import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { BtBackupsRoutes } from "./bt-backups.routing";
import { BtBackupsService } from "./bt-backups.service";
import { BtBackupsComponent } from "./bt-backups.component";

const COMPONENTS = [BtBackupsComponent];

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
        RouterModule.forChild(BtBackupsRoutes),
    ],
    declarations: COMPONENTS,
    providers: [BtBackupsService],
})
export class BtBackupsModule {}
