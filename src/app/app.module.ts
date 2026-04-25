import { APP_INITIALIZER, NgModule, ErrorHandler } from "@angular/core";
import {
    HttpClient,
    HttpClientModule,
    HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import { NgxSkeletonLoaderModule } from "ngx-skeleton-loader";

// Modules
import { SharedModule } from "./shared/shared.module";

// Services
import { ErrorHandlerService } from "./shared/services/error-handler.service";

// Interceptors
import { ApiInterceptor } from "./shared/interceptors/api.interceptor";

// Auth
import { JwtAuthService } from "./shared/services/auth/jwt-auth.service";

export function initializeAuth(
    jwtAuthService: JwtAuthService,
): () => Promise<void> {
    return () => jwtAuthService.initAuth();
}

import { AppRoutes } from "./app.routing";
import { AppComponent } from "./app.component";

// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient);
}

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        RouterModule.forRoot(AppRoutes, {
            useHash: false,
            relativeLinkResolution: "legacy",
        }),
        NgxSkeletonLoaderModule.forRoot({
            animation: "progress",
        }),
    ],
    declarations: [AppComponent],
    providers: [
        { provide: ErrorHandler, useClass: ErrorHandlerService },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ApiInterceptor,
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuth,
            deps: [JwtAuthService],
            multi: true,
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
