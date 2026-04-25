import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router, ActivatedRoute } from "@angular/router";
import { BehaviorSubject, firstValueFrom, Observable } from "rxjs";

// Services
import { LocalStoreService } from "../local-store.service";

// Models
import { PraUser } from "../../models";
import { AppRoute } from "../../enums";

@Injectable({
    providedIn: "root",
})
export class JwtAuthService {
    private static readonly PRA_JWT_TOKEN_KEY = "PRA_JWT_TOKEN";
    private static readonly PRA_USER_PROFILE_KEY = "PRA_USER_PROFILE";

    private static readonly ANONYMOUS_USER: PraUser = {
        username: "anonymous",
        displayName: "Anonymous",
        role: "None",
        businessUnit: undefined,
        canManagePraUsers: undefined,
    };

    public praUser: Observable<PraUser>;
    public return: string;

    private userProfile: BehaviorSubject<PraUser>;

    constructor(
        private readonly ls: LocalStoreService,
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {
        const storedUser = this.ls.getItem(JwtAuthService.PRA_USER_PROFILE_KEY);
        this.userProfile = new BehaviorSubject<PraUser>(
            storedUser ?? JwtAuthService.ANONYMOUS_USER,
        );
        this.praUser = this.userProfile.asObservable();
        this.return = AppRoute.Customers;
        this.route.queryParams.subscribe(
            (params) => (this.return = params["return"] || AppRoute.Customers),
        );
    }

    public async login(username: string, password: string): Promise<void> {
        return await firstValueFrom(
            this.http.post<{ accessToken: string }>("auth/login", {
                username: username,
                password: password,
            }),
        )
            .then(async (res) => {
                this.saveJwtTokenToLocalStorage(res.accessToken);
                await this.checkTokenIsValid();
            })
            .catch((reason) => {
                this.signout();
                throw new Error(reason.message);
            });
    }

    public async checkTokenIsValid(): Promise<void> {
        return await firstValueFrom(this.http.get<PraUser>("auth/profile"))
            .then((res) => {
                this.userProfile.next(res);
                this.saveUserObjectToLocalStorage(res);
            })
            .catch((reason) => {
                this.signout();
                console.error(reason.message);
            });
    }

    /**
     * Intended exclusively for use by APP_INITIALIZER.
     * Validates the stored JWT token with the server and refreshes the user
     * profile in the BehaviorSubject before the app renders any component.
     *
     * Key difference from checkTokenIsValid():
     * - Skips the call entirely when no token is stored (unauthenticated start)
     * - On server rejection does NOT call signout() / router.navigateByUrl().
     *   The router has not started its initial navigation yet at APP_INITIALIZER
     *   time, so queuing a navigation here can interfere with the initial URL
     *   processing. The AuthGuard handles the redirect to login instead.
     */
    public async initAuth(): Promise<void> {
        if (!this.getJwtToken()) {
            // No token stored — user is not logged in, nothing to validate.
            return;
        }
        try {
            const user = await firstValueFrom(
                this.http.get<PraUser>("auth/profile"),
            );
            this.userProfile.next(user);
            this.saveUserObjectToLocalStorage(user);
        } catch {
            // Token was rejected by the server (expired, revoked, or invalid).
            // Clear stale session state without navigating — AuthGuard will
            // redirect to the login page when the initial navigation runs.
            this.userProfile.next(JwtAuthService.ANONYMOUS_USER);
            this.ls.clear();
        }
    }

    public signout(): void {
        this.userProfile.next(JwtAuthService.ANONYMOUS_USER);
        this.ls.clear();

        void this.router.navigateByUrl(AppRoute.SignIn);
    }

    public isLoggedIn(): boolean {
        return !!this.getPraUser();
    }

    /**
     * Checks whether the stored JWT token has expired by decoding its payload
     * and comparing the `exp` claim against the current time.
     *
     * No external library is needed — the payload is a standard base64-encoded
     * JSON object (the middle segment of the JWT).
     *
     * @returns true  if the token is missing, malformed, or past its expiry time
     * @returns false if the token is present and still valid (or has no exp claim)
     */
    public isTokenExpired(): boolean {
        const token = this.getJwtToken();
        if (!token) {
            return true;
        }
        try {
            const segments = token.split(".");
            if (segments.length !== 3) {
                return true;
            }
            // JWT payload is base64url-encoded — replace URL-safe chars before decoding
            const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(base64));
            if (typeof payload.exp !== "number") {
                // Token has no expiry claim — treat as valid
                return false;
            }
            // exp is in seconds, Date.now() is in milliseconds
            return payload.exp * 1000 < Date.now();
        } catch {
            // Malformed token — treat as expired to be safe
            return true;
        }
    }

    public getJwtToken(): string {
        return this.ls.getItem(JwtAuthService.PRA_JWT_TOKEN_KEY);
    }

    public getPraUser(): PraUser {
        return this.ls.getItem(JwtAuthService.PRA_USER_PROFILE_KEY);
    }

    private saveJwtTokenToLocalStorage(token: string): void {
        this.ls.setItem(JwtAuthService.PRA_JWT_TOKEN_KEY, token);
    }

    private saveUserObjectToLocalStorage(user: PraUser): void {
        this.ls.setItem(JwtAuthService.PRA_USER_PROFILE_KEY, user);
    }
}
