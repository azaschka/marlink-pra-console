import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSnackBarModule } from "@angular/material/snack-bar";

// Components
import { ConfirmDialogComponent } from "./confirm-dialog/confirm-dialog.component";
import { ErrorDialogComponent } from "./error-dialog/error-dialog.component";
import { NotificationDialogComponent } from "./notification-dialog/notification-dialog.component";

// Services
import { ConfirmDialogService } from "./confirm-dialog/confirm-dialog.service";
import { ErrorDialogService } from "./error-dialog/error-dialog.service";
import { NotificationDialogService } from "./notification-dialog/notification-dialog.service";
import { MatIconModule } from "@angular/material/icon";

const MODULES = [
    CommonModule,
    FlexLayoutModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
];

const COMPONENTS = [
    ConfirmDialogComponent,
    ErrorDialogComponent,
    NotificationDialogComponent,
];

const SERVICES = [
    ConfirmDialogService,
    ErrorDialogService,
    NotificationDialogService,
];

@NgModule({
    imports: MODULES,
    providers: SERVICES,
    declarations: COMPONENTS,
    exports: COMPONENTS,
})
export class SharedDialogsModule {}
