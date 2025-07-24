import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

// Services
import {
    IMenuItem,
    NavigationService,
} from "../../../shared/services/navigation.service";
import { ILayoutConf, LayoutService } from "app/shared/services/layout.service";
import { JwtAuthService } from "app/shared/services/auth/jwt-auth.service";

@Component({
    selector: "app-sidebar-side",
    templateUrl: "./sidebar-side.component.html",
})
export class SidebarSideComponent implements OnInit, OnDestroy {
    private static readonly DEFAULT_LOGO_URL =
        "assets/images/logos/logo-marlink.svg";
    private static readonly SMALL_LOGO_URL =
        "assets/images/logos/marlink-logo-small.png";
    private static readonly SIDEBAR_FULL_STYLE = "full";
    private static readonly SIDEBAR_COMPACT_STYLE = "compact";

    public menuItems: IMenuItem[];
    public hasIconTypeMenuItem: boolean;
    public iconTypeMenuTitle: string;
    public layoutConf: ILayoutConf;
    public isLoggedInUser: boolean;
    public logoUrl: string;
    public displayName: string;

    private readonly subscriptionsToClear: Subscription;

    constructor(
        private readonly navigationService: NavigationService,
        private readonly layoutService: LayoutService,
        private readonly jwtAuthService: JwtAuthService
    ) {
        this.isLoggedInUser = false;
        this.logoUrl = "";
        this.displayName = "";
        this.subscriptionsToClear = new Subscription();
    }

    public ngOnInit(): void {
        this.iconTypeMenuTitle = this.navigationService.iconTypeMenuTitle;
        this.layoutConf = this.layoutService.layoutConf;
        this.addListeners();
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    public toggleCollapse(): void {
        if (this.layoutConf.sidebarCompactToggle) {
            this.layoutService.publishLayoutChange({
                sidebarCompactToggle: false,
            });
        } else {
            this.layoutService.publishLayoutChange({
                // sidebarStyle: "compact",
                sidebarCompactToggle: true,
            });
        }
    }

    public logoutUser(): void {
        this.jwtAuthService.signout();
    }

    private addListeners(): void {
        this.subscriptionsToClear.add(
            this.navigationService.menuItems$.subscribe((menuItem) => {
                this.menuItems = menuItem;

                //Checks item list has any icon type.
                this.hasIconTypeMenuItem = !!this.menuItems.filter(
                    (item) => item.type === "icon"
                ).length;
            })
        );
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                this.isLoggedInUser = user.displayName !== "Anonymous";
                this.displayName = this.isLoggedInUser
                    ? user.displayName
                    : "loading ...";

                if (user.role !== "None") {
                    this.menuItems = this.menuItems.filter((item) => {
                        return item.roles.includes(user.role);
                    });
                }
            })
        );
        this.subscriptionsToClear.add(
            this.layoutService.layoutConf$.subscribe((layoutConf) => {
                if (
                    layoutConf.sidebarStyle ===
                    SidebarSideComponent.SIDEBAR_FULL_STYLE
                ) {
                    this.logoUrl = SidebarSideComponent.DEFAULT_LOGO_URL;
                } else if (
                    layoutConf.sidebarStyle ===
                    SidebarSideComponent.SIDEBAR_COMPACT_STYLE
                ) {
                    this.logoUrl = SidebarSideComponent.SMALL_LOGO_URL;
                }
            })
        );
    }
}
