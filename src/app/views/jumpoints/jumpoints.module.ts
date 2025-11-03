import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { SharedModule } from "../../shared/shared.module";
import { JumpointsService } from "./jumpoints.service";
import { JumpointsComponent } from "./jumpoints.component";
import { JumpointsRoutes } from "./jumpoints.routes";
import { JumpointInstallerDownloadOverlayComponent } from "./components/jumpoint-installer-download-overlay/jumpoint-installer-download-overlay.component";

const COMPONENTS = [
    JumpointsComponent,
    JumpointInstallerDownloadOverlayComponent,
];

const SERVICES = [JumpointsService];

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
        RouterModule.forChild(JumpointsRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class JumpointsModule {}
