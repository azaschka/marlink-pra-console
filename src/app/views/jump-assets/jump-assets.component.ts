import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";
import { egretAnimations } from "../../shared/animations/egret-animations";

@Component({
    selector: "app-views-jump-assets",
    templateUrl: "./jump-assets.component.html",
    styleUrls: ["./jump-assets.component.scss"],
    animations: egretAnimations,
})
export class JumpAssetsComponent implements OnInit, OnDestroy {
    private readonly subscriptionsToClear: Subscription;

    constructor(private readonly jwtAuthService: JwtAuthService) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
        this.addListeners();
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                if (!user || user.role === "None") {
                    this.jwtAuthService.checkTokenIsValid();
                }
            }),
        );
    }
}
