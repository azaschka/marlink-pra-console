import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { egretAnimations } from "../../shared/animations/egret-animations";
import { JwtAuthService } from "../../shared/services/auth/jwt-auth.service";

@Component({
    selector: "app-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
    animations: egretAnimations,
})
export class DashboardComponent implements OnInit, OnDestroy {
    private readonly subscriptionsToClear: Subscription;

    constructor(private readonly jwtAuthService: JwtAuthService) {
        this.subscriptionsToClear = new Subscription();
    }

    public async ngOnInit(): Promise<void> {
        this.jwtAuthService.getPraUser();
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
            })
        );
    }
}
