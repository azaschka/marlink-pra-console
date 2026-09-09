import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { DashboardRoutes } from "./dashboard.routing";
import { DashboardComponent } from "./dashboard.component";

// Components
import { BeyondtrustInstancesComponent } from "./components/beyondtrust-instaces/beyondtrust-instances.component";
import { HealthComponent } from "./components/health/health.component";
import { AccessKeysComponent } from "./components/access-keys/access-keys.component";
import { DangerZoneComponent } from "./components/danger-zone/danger-zone.component";

// Overlays
import { BeyondtrustInstancesOverlayComponent } from "./components/overlays/beyondtrust-instances-overlay/beyondtrust-instances-overlay.component";
import { AccessKeyOverlayComponent } from "./components/overlays/access-key-overlay/access-key-overlay.component";

const COMPONENTS = [
    DashboardComponent,
    BeyondtrustInstancesComponent,
    BeyondtrustInstancesOverlayComponent,
    HealthComponent,
    AccessKeysComponent,
    DangerZoneComponent,
];

const OVERLAYS = [
    BeyondtrustInstancesOverlayComponent,
    AccessKeyOverlayComponent,
];

const SERVICES = [];

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        TranslateModule,
        SharedMaterialModule,
        SharedModule,
        RouterModule.forChild(DashboardRoutes),
    ],
    declarations: [...COMPONENTS, ...OVERLAYS],
    providers: SERVICES,
})
export class DashboardModule {}
