import { Injectable } from "@angular/core";
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
} from "@angular/router";
import { JwtAuthService } from "../services/auth/jwt-auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AuthRole } from "../enums";

@Injectable()
export class UserRoleGuard implements CanActivate {
    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly router: Router,
        private readonly snack: MatSnackBar
    ) {}

    public canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ) {
        const praUser = this.jwtAuthService.getPraUser();

        if (
            praUser &&
            route.data &&
            route.data.roles &&
            route.data.roles.includes(praUser.role)
        ) {
            return true;
        } else {
            this.snack
                .open("You do not have access to this page!", "OK")
                .onAction()
                .subscribe(() => {
                    if (praUser.role === AuthRole.ADMIN) {
                        this.router.navigateByUrl("/subscriptions");
                    } else if (praUser.role === AuthRole.DATA_CENTER_ENGINEER) {
                        this.router.navigateByUrl("/backups");
                    }
                });

            return false;
        }
    }
}
