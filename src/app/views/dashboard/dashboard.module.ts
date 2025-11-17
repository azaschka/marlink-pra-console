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

const COMPONENTS = [DashboardComponent, BeyondtrustInstancesComponent];

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
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class DashboardModule {}
