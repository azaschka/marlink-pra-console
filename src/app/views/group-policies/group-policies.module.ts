import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { GroupPoliciesRoutes } from "./group-policies.routing";

import { UsersService } from "../users/users.service";
import { GroupPoliciesComponent } from "./group-policies.component";
import { GroupPolicyOverlayComponent } from "./components/group-policy-overlay/group-policy-overlay.component";

const COMPONENTS = [GroupPoliciesComponent, GroupPolicyOverlayComponent];

const SERVICES = [UsersService];

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
        RouterModule.forChild(GroupPoliciesRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class GroupPoliciesModule {}
