import { Component } from "@angular/core";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { egretAnimations } from "../../shared/animations/egret-animations";
import { PraBaseComponent } from "../../shared/components/pra-base/pra-base.component";

@Component({
    selector: "app-views-jump-assets",
    templateUrl: "./jump-assets.component.html",
    styleUrls: ["./jump-assets.component.scss"],
    animations: egretAnimations,
})
export class JumpAssetsComponent extends PraBaseComponent {
    constructor(jwtAuthService: JwtAuthService) {
        super(jwtAuthService);
    }
}
