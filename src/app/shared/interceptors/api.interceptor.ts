import { Injectable } from "@angular/core";
import {
    HttpEvent,
    HttpErrorResponse,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { config } from "config";
import { JwtAuthService } from "../services/auth/jwt-auth.service";

/**
 * Combined API interceptor that handles all API request modifications:
 * 1. Prepends API base URL to relative endpoints
 * 2. Adds x-api-key header for API authentication
 * 3. Adds x-access-key header for access control
 * 4. Adds JWT Bearer token for user authentication (when available)
 * 5. Handles 401 responses centrally — automatically signs the user out
 *    when the server rejects the token (expired or revoked), except on
 *    the auth/login endpoint where 401 means wrong credentials.
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
    constructor(private readonly jwtAuthService: JwtAuthService) {}

    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler,
    ): Observable<HttpEvent<any>> {
        // Skip transformation for asset requests
        if (req.url.indexOf("/assets") !== -1) {
            return next.handle(req);
        }

        // Transform request in single operation to avoid multiple clones
        const transformedReq = this.transformRequest(req);

        return next.handle(transformedReq).pipe(
            catchError((error: HttpErrorResponse) => {
                // A 401 on any endpoint other than auth/login means the JWT
                // token has expired or been revoked server-side. Sign the user
                // out immediately so stale state is cleared and they are
                // redirected to the login page.
                // auth/login itself returns 401 for wrong credentials — that
                // case must be handled by SigninComponent, not here.
                if (
                    error.status === 401 &&
                    !transformedReq.url.includes("auth/login")
                ) {
                    this.jwtAuthService.signout();
                }
                return throwError(() => error);
            }),
        );
    }

    private transformRequest(req: HttpRequest<any>): HttpRequest<any> {
        const apiUrl = config.praApiBaseUrl;
        const apiKey = config.praApiKey;
        const accessKey = config.praAccessKey;
        const jwtToken = this.jwtAuthService.getJwtToken();

        // Build headers object
        const headers: { [key: string]: string } = {
            "x-api-key": apiKey,
            "x-access-key": accessKey,
        };

        // Add JWT token if available (not present during login)
        if (jwtToken) {
            headers["Authorization"] = `Bearer ${jwtToken}`;
        }

        // Only prepend base URL if not already present
        const url = req.url.startsWith(apiUrl)
            ? req.url
            : `${apiUrl}/${req.url}`;

        // Clone request once with all modifications
        return req.clone({
            url,
            setHeaders: headers,
        });
    }
}
