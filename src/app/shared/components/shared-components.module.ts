import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { SharedMaterialModule } from "../shared-material.module";
import { TranslateModule } from "@ngx-translate/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SharedPipesModule } from "../pipes/shared-pipes.module";
import { FlexLayoutModule } from "@angular/flex-layout";
import { SharedDirectivesModule } from "../directives/shared-directives.module";

import { HeaderSideComponent } from "./header-side/header-side.component";
import { SidebarSideComponent } from "./sidebar-side/sidebar-side.component";

// import { HeaderTopComponent } from "./header-top/header-top.component";
// import { SidebarTopComponent } from "./sidebar-top/sidebar-top.component";

import { AdminLayoutComponent } from "./layouts/admin-layout/admin-layout.component";
import { AuthLayoutComponent } from "./layouts/auth-layout/auth-layout.component";
import { NotificationsComponent } from "./notifications/notifications.component";
import { SidenavComponent } from "./sidenav/sidenav.component";
import { FooterComponent } from "./footer/footer.component";
import { BreadcrumbComponent } from "./breadcrumb/breadcrumb.component";
import { AppComfirmComponent } from "../services/app-confirm/app-confirm.component";
import { AppErrorComponent } from "../services/app-error/app-error.component";
import { ButtonLoadingComponent } from "./button-loading/button-loading.component";
import {
    EgretSidebarComponent,
    EgretSidebarTogglerDirective,
} from "./egret-sidebar/egret-sidebar.component";
import { BottomSheetShareComponent } from "./bottom-sheet-share/bottom-sheet-share.component";
import { EgretNotifications2Component } from "./egret-notifications2/egret-notifications2.component";
import { SnackbarComponent } from "./snackbar/snackbar.component";
import { FileDragAreaComponent } from "./file-drag-area/file-drag-area.component";
import { WeekDayToggleComponent } from "./weekday-toggle/weekday-toggle.component";

const COMPONENTS = [
    // HeaderTopComponent,
    // SidebarTopComponent,
    SidenavComponent,
    NotificationsComponent,
    SidebarSideComponent,
    HeaderSideComponent,
    AdminLayoutComponent,
    AuthLayoutComponent,
    BreadcrumbComponent,
    AppComfirmComponent,
    AppErrorComponent,
    EgretNotifications2Component,
    ButtonLoadingComponent,
    EgretSidebarComponent,
    FooterComponent,
    EgretSidebarTogglerDirective,
    BottomSheetShareComponent,
    SnackbarComponent,
    FileDragAreaComponent,
    WeekDayToggleComponent,
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TranslateModule,
        FlexLayoutModule,
        SharedPipesModule,
        SharedDirectivesModule,
        SharedMaterialModule,
    ],
    declarations: [...COMPONENTS],
    exports: [...COMPONENTS],
})
export class SharedComponentsModule {}
