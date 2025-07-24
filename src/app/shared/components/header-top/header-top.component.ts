import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import {
    IMenuItem,
    NavigationService,
} from "../../../shared/services/navigation.service";
import { Subscription } from "rxjs";
import { ITheme, ThemeService } from "../../../shared/services/theme.service";
import { TranslateService } from "@ngx-translate/core";
import { ILayoutConf, LayoutService } from "../../services/layout.service";
import { JwtAuthService } from "app/shared/services/auth/jwt-auth.service";

@Component({
    selector: "app-header-top",
    templateUrl: "./header-top.component.html",
})
export class HeaderTopComponent implements OnInit, OnDestroy {
    @Input() notificPanel;

    public layoutConf: ILayoutConf;
    public menuItems: IMenuItem[] = [];
    public menuItemSub: Subscription;
    public egretThemes: ITheme[] = [];

    constructor(
        private layout: LayoutService,
        private navService: NavigationService,
        public themeService: ThemeService,
        private readonly translate: TranslateService,
        private readonly jwtAuthService: JwtAuthService
    ) {}

    public ngOnInit(): void {
        this.layoutConf = this.layout.layoutConf;
        this.egretThemes = this.themeService.egretThemes;
        this.translate.use("en");
        this.menuItemSub = this.navService.menuItems$.subscribe((res) => {
            res = res.filter(
                (item) => item.type !== "icon" && item.type !== "separator"
            );
            let limit = 4;
            let mainItems: IMenuItem[] = res.slice(0, limit);
            if (res.length <= limit) {
                return (this.menuItems = mainItems);
            }
            let subItems: any[] = res.slice(limit, res.length - 1);
            mainItems.push({
                name: "More",
                type: "dropDown",
                tooltip: "More",
                icon: "more_horiz",
                sub: subItems,
                roles: [],
            });
            this.menuItems = mainItems;
        });
    }

    public ngOnDestroy(): void {
        this.menuItemSub.unsubscribe();
    }

    public toggleNotific(): void {
        this.notificPanel.toggle();
    }

    public toggleSidenav(): void {
        if (this.layoutConf.sidebarStyle === "closed") {
            return this.layout.publishLayoutChange({
                sidebarStyle: "full",
            });
        }

        this.layout.publishLayoutChange({
            sidebarStyle: "closed",
        });
    }

    public logoutUser(): void {
        this.jwtAuthService.signout();
    }
}
