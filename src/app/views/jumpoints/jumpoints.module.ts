import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { SharedModule } from "../../shared/shared.module";

import { JumpointsComponent } from "./jumpoints.component";
import { JumpointsRoutes } from "./jumpoints.routes";
import { JumpointInstallerDownloadOverlayComponent } from "./components/jumpoint-installer-download-overlay/jumpoint-installer-download-overlay.component";
import { JumpointDeployOverlayComponent } from "./components/jumpoint-deploy-overlay/jumpoint-deploy-overlay.component";
import { JumpointNodeInfoOverlayComponent } from "./components/jumpoint-node-info-overlay/jumpoint-node-info-overlay.component";
import { SitesService } from "../sites/sites.service";

const COMPONENTS = [
    JumpointsComponent,
    JumpointInstallerDownloadOverlayComponent,
    JumpointDeployOverlayComponent,
    JumpointNodeInfoOverlayComponent,
];

const SERVICES = [SitesService];

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
