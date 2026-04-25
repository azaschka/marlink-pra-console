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
    constructor(jwtAuthService: JwtAuthService) {
        super(jwtAuthService);
    }
}
