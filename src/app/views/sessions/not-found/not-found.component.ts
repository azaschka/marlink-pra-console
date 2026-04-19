import { Component } from "@angular/core";
import { AppRoute, AuthRole } from "app/shared/enums";
import { JwtAuthService } from "app/shared/services/auth/jwt-auth.service";

@Component({
    selector: "app-not-found",
    templateUrl: "./not-found.component.html",
})
export class NotFoundComponent {
    public readonly AppRoute = AppRoute;

    constructor(private readonly jwtAuthService: JwtAuthService) {}

    public get homeRoute(): AppRoute {
        const user = this.jwtAuthService.getPraUser();
        if (user?.role === AuthRole.DATA_CENTER_ENGINEER) {
            return AppRoute.BtDiscrepancies;
        }
        return AppRoute.Customers;
    }
}
