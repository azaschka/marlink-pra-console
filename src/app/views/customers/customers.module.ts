import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { CsvModule } from "@ctrl/ngx-csv";
import { SharedModule } from "../../shared/shared.module";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { CustomersRoutes } from "./customers.routing";

import { CustomersComponent } from "./customers.component";
import { CustomerOverlayComponent } from "./components/customer-overlay/customer-overlay.component";

const COMPONENTS = [CustomersComponent, CustomerOverlayComponent];

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
        RouterModule.forChild(CustomersRoutes),
    ],
    declarations: COMPONENTS,
    providers: [],
})
export class CustomersModule {}
