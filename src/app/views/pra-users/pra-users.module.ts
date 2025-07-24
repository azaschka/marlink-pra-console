import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { PraUsersRoutes } from "./pra-users.routing";
import { PraUsersService } from "./pra-users.service";
import { PraUsersComponent } from "./pra-users.component";
import { PraUserOverlayComponent } from "./components/pra-user-overlay/pra-user-overlay.component";

const COMPONENTS = [PraUsersComponent, PraUserOverlayComponent];

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
        RouterModule.forChild(PraUsersRoutes),
    ],
    declarations: COMPONENTS,
    providers: [PraUsersService],
})
export class PraUsersModule {}
