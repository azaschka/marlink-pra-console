import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router, ActivatedRoute } from "@angular/router";
import { BehaviorSubject, firstValueFrom, Observable, Subject } from "rxjs";

// Services
import { LocalStoreService } from "../local-store.service";

// Models
import { PraUser } from "../../models";

@Injectable({
    providedIn: "root",
})
export class JwtAuthService {
    private static readonly PRA_JWT_TOKEN_KEY = "PRA_JWT_TOKEN";
    private static readonly PRA_USER_PROFILE_KEY = "PRA_USER_PROFILE";

    public praUser: Observable<PraUser>;
    public return: string;

    private userProfile: BehaviorSubject<PraUser>;

    constructor(
        private readonly ls: LocalStoreService,
        private readonly http: HttpClient,
        private readonly router: Router,
        private readonly route: ActivatedRoute
    ) {
        this.route.queryParams.subscribe(
            (params) => (this.return = params["return"] || "/")
        );
        this.userProfile = new BehaviorSubject<PraUser>({
            username: "anonymous",
            displayName: "Anonymous",
            role: "None",
        });
        this.praUser = this.userProfile.asObservable();
    }

    public async login(username: string, password: string): Promise<void> {
        return await firstValueFrom(
            this.http.post<{ accessToken: string }>("auth/login", {
                username: username,
                password: password,
            })
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

    /*
        checkTokenIsValid is called inside constructor of
        shared/components/layouts/admin-layout/admin-layout.component.ts
    */
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

    public signout(): void {
        this.ls.clear();

        void this.router.navigateByUrl("sessions/signin");
    }

    public isLoggedIn(): boolean {
        return !!this.getPraUser();
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
