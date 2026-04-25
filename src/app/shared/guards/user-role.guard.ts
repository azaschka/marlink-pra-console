import { Injectable } from "@angular/core";
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
} from "@angular/router";
import { JwtAuthService } from "../services/auth/jwt-auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AppRoute, AuthRole } from "../enums";

@Injectable()
export class UserRoleGuard implements CanActivate {
    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly router: Router,
        private readonly snack: MatSnackBar,
    ) {}

    public canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ): boolean {
        const praUser = this.jwtAuthService.getPraUser();

        // Defensive: no user in storage means the session has been cleared.
        // AuthGuard should have prevented reaching here, but guard against it
        // explicitly so the role checks below can safely access praUser.role.
        if (!praUser) {
            void this.router.navigateByUrl(AppRoute.SignIn);
            return false;
        }

        if (route.data?.roles?.includes(praUser.role)) {
            return true;
        }

        // User is authenticated but lacks the required role for this route.
        // Show a non-blocking notification and offer a one-click escape hatch
        // to their appropriate home page via the snackbar action.
        this.snack
            .open("You do not have access to this page!", "OK")
            .onAction()
            .subscribe(() => {
                if (praUser.role === AuthRole.SUPER_ADMIN) {
                    this.router.navigateByUrl(AppRoute.Customers);
                } else if (praUser.role === AuthRole.ADMIN) {
                    this.router.navigateByUrl(AppRoute.Customers);
                } else if (praUser.role === AuthRole.DATA_CENTER_ENGINEER) {
                    this.router.navigateByUrl(AppRoute.BtDiscrepancies);
                }
            });

        return false;
    }
}
