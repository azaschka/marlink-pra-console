import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

// Services
import { ThemeService } from "./services/theme.service";
import { NavigationService } from "./services/navigation.service";
import { RoutePartsService } from "./services/route-parts.service";
import { AuthGuard } from "./guards/auth.guard";
import { UserRoleGuard } from "./guards/user-role.guard";
import { AppConfirmService } from "./services/app-confirm/app-confirm.service";
import { AppErrorService } from "./services/app-error/app-error.service";
import { SiteExcelParserService } from "./services/site-excel-parser.service";
import { SnackbarService } from "./services/snackbar.service";

// Modules
import { SharedComponentsModule } from "./components/shared-components.module";
import { SharedDialogsModule } from "./dialogs/shared-dialogs.module";
import { SharedPipesModule } from "./pipes/shared-pipes.module";
import { SharedDirectivesModule } from "./directives/shared-directives.module";

@NgModule({
    imports: [
        CommonModule,
        SharedComponentsModule,
        SharedPipesModule,
        SharedDirectivesModule,
        NgxSkeletonLoaderModule,
    ],
    providers: [
        ThemeService,
        NavigationService,
        RoutePartsService,
        AuthGuard,
        UserRoleGuard,
        AppConfirmService,
        AppErrorService,
        SiteExcelParserService,
        SnackbarService,
    ],
    exports: [
        SharedComponentsModule,
        SharedDialogsModule,
        SharedPipesModule,
        SharedDirectivesModule,
        NgxSkeletonLoaderModule,
    ],
})
export class SharedModule {}
