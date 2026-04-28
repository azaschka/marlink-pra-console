import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { SharedModule } from "../../shared/shared.module";
import { JumpClientInstallersService } from "./jump-client-installers.service";
import { JumpClientInstallersComponent } from "./jump-client-installers.component";
import { JumpClientInstallersRoutes } from "./jump-client-installers.routes";
import { JumpClientInstallerDownloadOverlayComponent } from "./components/jump-client-installer-download-overlay/jump-client-installer-download-overlay.component";
import { JumpClientInstallerCreateOverlayComponent } from "./components/jump-client-installer-create-overlay/jump-client-installer-create-overlay.component";
import { JumpGroupsService } from "../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../jump-policies/jump-policies.service";
import { SessionPoliciesService } from "../session-policies/session-policies.service";

const COMPONENTS = [
    JumpClientInstallersComponent,
    JumpClientInstallerDownloadOverlayComponent,
    JumpClientInstallerCreateOverlayComponent,
];

const SERVICES = [
    JumpClientInstallersService,
    JumpGroupsService,
    JumpPoliciesService,
    SessionPoliciesService,
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
        RouterModule.forChild(JumpClientInstallersRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class JumpClientInstallersModule {}
