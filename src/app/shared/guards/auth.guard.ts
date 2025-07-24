import { Injectable } from "@angular/core";
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
} from "@angular/router";
import { JwtAuthService } from "../services/auth/jwt-auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private readonly jwtAuthService: JwtAuthService
    ) {}

    public canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        if (this.jwtAuthService.isLoggedIn()) {
            return true;
        } else {
            this.router.navigate(["/sessions/signin"], {
                queryParams: {
                    return: state.url,
                },
            });

            return false;
        }
    }
}
