import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";

import { AppRoute } from "../../enums";
import { PraUser } from "../../models";
import { LocalStoreService } from "../local-store.service";
import { JwtAuthService } from "./jwt-auth.service";

class FakeLocalStoreService {
    private readonly store = new Map<string, unknown>();

    public setItem(key: string, value: unknown): boolean {
        this.store.set(key, value);
        return true;
    }

    public getItem(key: string): any {
        return this.store.has(key) ? this.store.get(key) : null;
    }

    public clear(): void {
        this.store.clear();
    }
}

describe("JwtAuthService", () => {
    let service: JwtAuthService;
    let httpMock: HttpTestingController;
    let localStore: FakeLocalStoreService;
    let routerSpy: jasmine.SpyObj<Router>;

    const praUser: PraUser = {
        username: "john.doe",
        displayName: "John Doe",
        role: "Admin",
        businessUnit: undefined,
        canManagePraUsers: true,
    };

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj("Router", ["navigateByUrl"]);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                JwtAuthService,
                {
                    provide: LocalStoreService,
                    useClass: FakeLocalStoreService,
                },
                {
                    provide: Router,
                    useValue: routerSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({}),
                    },
                },
            ],
        });

        service = TestBed.inject(JwtAuthService);
        httpMock = TestBed.inject(HttpTestingController);
        localStore = TestBed.inject(LocalStoreService) as unknown as FakeLocalStoreService;
    });

    afterEach(() => {
        httpMock.verify();
    });

    it("stores token and profile on successful login", async () => {
        const loginPromise = service.login("john.doe", "secret");

        const loginRequest = httpMock.expectOne("auth/login");
        expect(loginRequest.request.method).toBe("POST");
        expect(loginRequest.request.body).toEqual({
            username: "john.doe",
            password: "secret",
        });
        loginRequest.flush({ accessToken: "jwt-token" });

        await Promise.resolve();

        const profileRequest = httpMock.expectOne("auth/profile");
        expect(profileRequest.request.method).toBe("GET");
        profileRequest.flush(praUser);

        await loginPromise;

        expect(service.getJwtToken()).toBe("jwt-token");
        expect(service.getPraUser()).toEqual(praUser);
    });

    it("signs out and throws contextual error when login fails", async () => {
        const loginPromise = service.login("john.doe", "wrong");

        const loginRequest = httpMock.expectOne("auth/login");
        loginRequest.flush(
            { message: "Invalid credentials" },
            { status: 401, statusText: "Unauthorized" },
        );

        await expectAsync(loginPromise).toBeRejectedWithError(
            /\[JwtAuthService\.login\] Failed to sign in/,
        );

        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(AppRoute.SignIn);
        expect(service.getJwtToken()).toBeNull();
        expect(service.getPraUser()).toBeNull();
    });

    it("throws contextual error when token validation fails", async () => {
        localStore.setItem("PRA_JWT_TOKEN", "existing-token");

        const checkPromise = service.checkTokenIsValid();

        const profileRequest = httpMock.expectOne("auth/profile");
        profileRequest.flush(
            { message: "Token expired" },
            { status: 401, statusText: "Unauthorized" },
        );

        await expectAsync(checkPromise).toBeRejectedWithError(
            /\[JwtAuthService\.checkTokenIsValid\] Token validation failed/,
        );

        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(AppRoute.SignIn);
        expect(service.getJwtToken()).toBeNull();
    });
});
