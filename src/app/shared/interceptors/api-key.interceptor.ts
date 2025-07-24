import { Injectable } from "@angular/core";
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { config } from "config";

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {
    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        if (req.url.indexOf("/assets") === -1) {
            req = this.addApiBaseUrl(req);
            req = this.addApiSubscriptionKey(req);
        }

        return next.handle(req);
    }

    private addApiBaseUrl(req: HttpRequest<any>): HttpRequest<any> {
        const apiUrl = config.praApiBaseUrl;
        const changedReq = req.clone({ url: `${apiUrl}/${req.url}` });

        return changedReq;
    }

    private addApiSubscriptionKey(req: HttpRequest<any>): HttpRequest<any> {
        const praApiKey = config.praApiKey;

        const changedReq = req.clone({
            headers: req.headers.set("x-api-key", praApiKey),
        });

        return changedReq;
    }
}
