import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import {
    IMenuItem,
    NavigationService,
} from "../../../shared/services/navigation.service";
import {
    ILayoutConf,
    LayoutService,
} from "../../../shared/services/layout.service";
import { JwtAuthService } from "../../../shared/services/auth/jwt-auth.service";
import { PraUser } from "../../models/pra-user.model";
const packageJson = require("../../../../../package.json");

type SidebarStyle = "full" | "compact";

@Component({
    selector: "app-sidebar-side",
    templateUrl: "./sidebar-side.component.html",
})
export class SidebarSideComponent implements OnInit, OnDestroy {
    private static readonly LOGO_URLS: Record<SidebarStyle, string> = {
        full: "assets/images/logos/logo-marlink.svg",
        compact: "assets/images/logos/marlink-logo-small.png",
    };
    private static readonly ANONYMOUS_USER = "Anonymous";
    private static readonly NONE_ROLE = "None";

    public menuItems: IMenuItem[] = [];
    public hasIconTypeMenuItem = false;
    public iconTypeMenuTitle = "";
    public layoutConf: ILayoutConf;
    public isLoggedInUser = false;
    public logoUrl = "";
    public displayName = "";
    public appVersion = packageJson.version;

    private subscriptions = new Subscription();

    constructor(
        private readonly navigationService: NavigationService,
        private readonly layoutService: LayoutService,
        private readonly jwtAuthService: JwtAuthService
    ) {}

    public ngOnInit(): void {
        this.iconTypeMenuTitle = this.navigationService.iconTypeMenuTitle;
        this.layoutConf = this.layoutService.layoutConf;
        this.setupSubscriptions();
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    public toggleCollapse(): void {
        this.layoutService.publishLayoutChange({
            sidebarCompactToggle: !this.layoutConf.sidebarCompactToggle,
        });
    }

    public logoutUser(): void {
        this.jwtAuthService.signout();
    }

    private setupSubscriptions(): void {
        // Combine menu items and user to avoid race conditions
        this.subscriptions.add(
            combineLatest([
                this.navigationService.menuItems$,
                this.jwtAuthService.praUser,
            ])
                .pipe(
                    map(([menuItems, user]) => {
                        return this.filterMenuItemsByUserRole(menuItems, user);
                    })
                )
                .subscribe((filteredMenuItems) => {
                    this.menuItems = filteredMenuItems;
                    this.hasIconTypeMenuItem =
                        this.checkHasIconTypeMenuItem(filteredMenuItems);
                })
        );

        this.subscriptions.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                this.isLoggedInUser =
                    user.displayName !== SidebarSideComponent.ANONYMOUS_USER;
                this.displayName = this.isLoggedInUser
                    ? user.displayName
                    : "loading ...";
            })
        );

        this.subscriptions.add(
            this.layoutService.layoutConf$.subscribe((layoutConf) => {
                this.logoUrl = this.getLogoUrl(
                    layoutConf.sidebarStyle as SidebarStyle
                );
            })
        );
    }

    private filterMenuItemsByUserRole(
        menuItems: IMenuItem[],
        user: PraUser
    ): IMenuItem[] {
        if (user.role === SidebarSideComponent.NONE_ROLE) {
            return menuItems;
        }

        return menuItems.filter((item) =>
            item.roles.some(
                (role) =>
                    role === user.role ||
                    (role ===
                        NavigationService.CAN_MANAGE_PRA_USERS_PERMISSION &&
                        user.canManagePraUsers)
            )
        );
    }

    private checkHasIconTypeMenuItem(menuItems: IMenuItem[]): boolean {
        return menuItems.some((item) => item.type === "icon");
    }

    private getLogoUrl(sidebarStyle: SidebarStyle): string {
        return (
            SidebarSideComponent.LOGO_URLS[sidebarStyle] ||
            SidebarSideComponent.LOGO_URLS.full
        );
    }
}
