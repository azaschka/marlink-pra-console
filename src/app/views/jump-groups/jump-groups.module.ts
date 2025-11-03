import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { SharedModule } from "../../shared/shared.module";
import { JumpGroupsService } from "./jump-groups.service";
import { JumpGroupsComponent } from "./jump-groups.component";
import { JumpGroupsRoutes } from "./jump-groups.routing";
import { CustomersService } from "../customers/customers.service";
import { JumpGroupUpdateOverlayComponent } from "./components/jump-group-update-overlay/jump-group-update-overlay.component";

const COMPONENTS = [JumpGroupsComponent, JumpGroupUpdateOverlayComponent];

const SERVICES = [JumpGroupsService, CustomersService];

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
        RouterModule.forChild(JumpGroupsRoutes),
    ],
    declarations: COMPONENTS,
    providers: SERVICES,
})
export class JumpGroupsModule {}
