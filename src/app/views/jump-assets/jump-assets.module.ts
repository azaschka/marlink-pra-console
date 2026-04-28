import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { JumpAssetsRoutes } from "./jump-assets.routing";

// Services
import { JumpAssetsService } from "./jump-assets.service";
import { JumpGroupsService } from "../jump-groups/jump-groups.service";
import { JumpPoliciesService } from "../jump-policies/jump-policies.service";
import { JumpointsService } from "../jumpoints/jumpoints.service";
import { CustomersService } from "../customers/customers.service";
import { SessionPoliciesService } from "../session-policies/session-policies.service";

// Components
import { JumpAssetsComponent } from "./jump-assets.component";
import { JumpAssetCopyOverlayComponent } from "./components/jump-asset-copy-overlay/jump-asset-copy-overlay.component";
import { JumpAssetCreateOverlayComponent } from "./components/jump-asset-create-overlay/jump-asset-create-overlay.component";
import { JumpAssetUpdateOverlayComponent } from "./components/jump-asset-update-overlay/jump-asset-update-overlay.component";
import { RemoteRdpComponent } from "./components/remote-rdp/remote-rdp.component";
import { RemoteVncComponent } from "./components/remote-vnc/remote-vnc.component";
import { ShellJumpComponent } from "./components/shell-jump/shell-jump.component";
import { WebJumpComponent } from "./components/web-jump/web-jump.component";
import { ProtocolTunnelComponent } from "./components/protocol-tunnel/protocol-tunnel.component";
import { JumpClientsComponent } from "./components/jump-clients/jump-clients.component";

const COMPONENTS = [
    JumpAssetCopyOverlayComponent,
    JumpAssetCreateOverlayComponent,
    JumpAssetUpdateOverlayComponent,
    JumpAssetsComponent,
    RemoteRdpComponent,
    RemoteVncComponent,
    ShellJumpComponent,
    WebJumpComponent,
    ProtocolTunnelComponent,
    JumpClientsComponent,
];

const SERVICES = [
    JumpAssetsService,
    JumpGroupsService,
    JumpPoliciesService,
    SessionPoliciesService,
    JumpointsService,
    CustomersService,
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
        RouterModule.forChild(JumpAssetsRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class JumpAssetsModule {}
