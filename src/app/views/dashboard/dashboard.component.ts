import { Component } from "@angular/core";
import { egretAnimations } from "../../shared/animations/egret-animations";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";

@Component({
    selector: "app-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
    animations: egretAnimations,
})
export class DashboardComponent extends PraBaseComponent {
    private static readonly RESET_ALLOWED_USERNAME = "a.zaschka@treatec.de";

    constructor(jwtAuthService: JwtAuthService) {
        super(jwtAuthService);
    }

    /**
     * Whether the current user may see and use the Danger Zone.
     * This is only a cosmetic gate — the API enforces the same allow-list
     * server-side via the reset authorization guard.
     */
    public get canResetData(): boolean {
        return (
            this.jwtAuthService.getPraUser()?.username ===
            DashboardComponent.RESET_ALLOWED_USERNAME
        );
    }
}
