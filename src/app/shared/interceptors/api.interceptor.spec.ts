import {
    HTTP_INTERCEPTORS,
    HttpClient,
    HttpErrorResponse,
} from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";

import { JwtAuthService } from "../services/auth/jwt-auth.service";
import { ApiInterceptor } from "./api.interceptor";

describe("ApiInterceptor", () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;
    let jwtAuthServiceSpy: jasmine.SpyObj<JwtAuthService>;

    beforeEach(() => {
        jwtAuthServiceSpy = jasmine.createSpyObj("JwtAuthService", [
            "getJwtToken",
            "signout",
        ]);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                {
                    provide: JwtAuthService,
                    useValue: jwtAuthServiceSpy,
                },
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: ApiInterceptor,
                    multi: true,
                },
            ],
        });

        http = TestBed.inject(HttpClient);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("adds api and auth headers and prepends base url for relative endpoints", () => {
        jwtAuthServiceSpy.getJwtToken.and.returnValue("jwt-token");

        http.get("customers").subscribe();

        const request = httpMock.expectOne("/api/customers");
        expect(request.request.headers.get("Authorization")).toBe("Bearer jwt-token");
        expect(request.request.headers.has("x-api-key")).toBeTrue();
        expect(request.request.headers.has("x-access-key")).toBeTrue();
        request.flush([]);
    });

    it("signs out on 401 responses for non-login endpoints", (done) => {
        jwtAuthServiceSpy.getJwtToken.and.returnValue(null);

        http.get("customers").subscribe({
            next: () => {
                fail("Expected request to error");
            },
            error: (error: HttpErrorResponse) => {
                expect(error.status).toBe(401);
                expect(jwtAuthServiceSpy.signout).toHaveBeenCalledTimes(1);
                done();
            },
        });

        const request = httpMock.expectOne("/api/customers");
        request.flush({}, { status: 401, statusText: "Unauthorized" });
    });
});
