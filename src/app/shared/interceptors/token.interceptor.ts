import { Injectable } from "@angular/core";
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { JwtAuthService } from "../services/auth/jwt-auth.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    constructor(private jwtAuthService: JwtAuthService) {}

    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const token = this.jwtAuthService.getJwtToken();

        if (req.url.indexOf("/assets") === -1 && token) {
            req = this.addBearerToken(req, token);
        }

        return next.handle(req);
    }

    private addBearerToken(
        req: HttpRequest<any>,
        token: string
    ): HttpRequest<any> {
        const changedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });

        return changedReq;
    }
}
