import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { UsersRoutes } from "./users.routing";
import { UsersService } from "./users.service";
import { GroupPoliciesService } from "../group-policies/group-policies.service";
import { UsersComponent } from "./users.component";
import { UserOverlayComponent } from "./components/user-overlay/user-overlay.component";

const COMPONENTS = [UsersComponent, UserOverlayComponent];

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
        RouterModule.forChild(UsersRoutes),
    ],
    declarations: COMPONENTS,
    providers: [UsersService, GroupPoliciesService],
})
export class UsersModule {}
