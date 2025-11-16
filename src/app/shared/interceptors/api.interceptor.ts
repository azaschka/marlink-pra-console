import { Injectable } from "@angular/core";
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { config } from "config";
import { JwtAuthService } from "../services/auth/jwt-auth.service";

/**
 * Combined API interceptor that handles all API request modifications:
 * 1. Prepends API base URL to relative endpoints
 * 2. Adds x-api-key header for API authentication
 * 3. Adds x-access-key header for access control
 * 4. Adds JWT Bearer token for user authentication (when available)
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
    constructor(private readonly jwtAuthService: JwtAuthService) {}

    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        // Skip transformation for asset requests
        if (req.url.indexOf("/assets") !== -1) {
            return next.handle(req);
        }

        // Transform request in single operation to avoid multiple clones
        const transformedReq = this.transformRequest(req);

        return next.handle(transformedReq);
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
