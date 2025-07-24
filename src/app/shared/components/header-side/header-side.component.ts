import { Component, OnInit, Input, ViewChildren } from "@angular/core";
import { ITheme, ThemeService } from "../../services/theme.service";
import { ILayoutConf, LayoutService } from "../../services/layout.service";
import { TranslateService } from "@ngx-translate/core";
import { JwtAuthService } from "../../services/auth/jwt-auth.service";
import { EgretNotifications2Component } from "../egret-notifications2/egret-notifications2.component";

@Component({
    selector: "app-header-side",
    templateUrl: "./header-side.template.html",
})
export class HeaderSideComponent implements OnInit {
    @Input() notificPanel;
    @ViewChildren(EgretNotifications2Component) noti;

    public egretThemes: ITheme[] = [];
    public layoutConf: ILayoutConf;

    constructor(
        private readonly themeService: ThemeService,
        private readonly layout: LayoutService,
        private readonly translate: TranslateService,
        private readonly jwtAuthService: JwtAuthService
    ) {}

    public ngOnInit(): void {
        this.egretThemes = this.themeService.egretThemes;
        this.layoutConf = this.layout.layoutConf;
        this.translate.use("en");
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

    public toggleCollapse(): void {
        // compact --> full
        if (this.layoutConf.sidebarStyle === "compact") {
            return this.layout.publishLayoutChange(
                {
                    sidebarStyle: "full",
                    sidebarCompactToggle: false,
                },
                { transitionClass: true }
            );
        }

        // * --> compact
        this.layout.publishLayoutChange(
            {
                sidebarStyle: "compact",
                sidebarCompactToggle: true,
            },
            { transitionClass: true }
        );
    }

    public logoutUser(): void {
        this.jwtAuthService.signout();
    }
}
