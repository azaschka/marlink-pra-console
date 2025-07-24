import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { FlexLayoutModule } from "@angular/flex-layout";
import { TranslateModule } from "@ngx-translate/core";
import { SharedMaterialModule } from "../../shared/shared-material.module";
import { ForgotPasswordComponent } from "./forgot-password/forgot-password.component";
import { LockscreenComponent } from "./lockscreen/lockscreen.component";
import { SigninComponent } from "./signin/signin.component";
import { SignupComponent } from "./signup/signup.component";
import { SessionsRoutes } from "./sessions.routing";
import { NotFoundComponent } from "./not-found/not-found.component";
import { ErrorComponent } from "./error/error.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ReactiveFormsModule,
        SharedMaterialModule,
        FlexLayoutModule,
        RouterModule.forChild(SessionsRoutes),
    ],
    declarations: [
        ForgotPasswordComponent,
        LockscreenComponent,
        SigninComponent,
        SignupComponent,
        NotFoundComponent,
        ErrorComponent,
    ],
})
export class SessionsModule {}
