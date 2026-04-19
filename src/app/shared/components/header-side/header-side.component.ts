import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    QueryList,
    ViewChildren,
} from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Subscription, filter } from "rxjs";
import { ITheme, ThemeService } from "../../services/theme.service";
import { ILayoutConf, LayoutService } from "../../services/layout.service";
import { TranslateService } from "@ngx-translate/core";
import { JwtAuthService } from "../../services/auth/jwt-auth.service";
import { EgretNotifications2Component } from "../egret-notifications2/egret-notifications2.component";
import { AppService } from "app/app.service";
import { BeyondtrustInstance } from "app/views/dashboard/components/beyondtrust-instaces/models";
import { AuthRole } from "app/shared/enums";
import { PraUser } from "app/shared/models";

@Component({
    selector: "app-header-side",
    templateUrl: "./header-side.template.html",
    styleUrls: ["./header-side.component.scss"],
})
export class HeaderSideComponent implements OnInit, OnDestroy {
    @Input() notificPanel!: { toggle: () => void };
    @ViewChildren(EgretNotifications2Component)
    noti!: QueryList<EgretNotifications2Component>;

    public egretThemes: ITheme[] = [];
    public layoutConf!: ILayoutConf;

    // BeyondTrust instance selection
    public instances: BeyondtrustInstance[] = [];
    public selectedInstanceId: number | null = null;
    public showInstanceSelector = true; // Hide on /dashboard and /logs

    private currentUser: PraUser | null = null;
    private readonly subscriptionsToClear = new Subscription();

    constructor(
        private readonly themeService: ThemeService,
        private readonly layout: LayoutService,
        private readonly translate: TranslateService,
        private readonly jwtAuthService: JwtAuthService,
        private readonly appService: AppService,
        private readonly router: Router,
    ) {}

    public async ngOnInit(): Promise<void> {
        this.egretThemes = this.themeService.egretThemes;
        this.layoutConf = this.layout.layoutConf;
        this.translate.use("en");

        // Ensure AppService is initialized before subscribing to prevent empty data
        await this.appService.initialize();

        // Subscribe to instances
        this.subscriptionsToClear.add(
            this.appService.instances$.subscribe((instances) => {
                this.instances = instances;
            }),
        );

        // Subscribe to selected instance
        this.subscriptionsToClear.add(
            this.appService.selectedInstanceId$.subscribe((id) => {
                this.selectedInstanceId = id;
            }),
        );

        // Subscribe to current user for BU-based instance filtering
        this.subscriptionsToClear.add(
            this.jwtAuthService.praUser.subscribe((user) => {
                this.currentUser = user;
            }),
        );

        // Hide instance selector on /dashboard and /logs routes
        this.updateInstanceSelectorVisibility(this.router.url);
        this.subscriptionsToClear.add(
            this.router.events
                .pipe(filter((event) => event instanceof NavigationEnd))
                .subscribe((event: NavigationEnd) => {
                    this.updateInstanceSelectorVisibility(
                        event.urlAfterRedirects,
                    );
                }),
        );
    }

    public ngOnDestroy(): void {
        this.subscriptionsToClear.unsubscribe();
    }

    /**
     * Updates visibility of instance selector based on current route
     */
    private updateInstanceSelectorVisibility(url: string): void {
        const hiddenRoutes = [
            "/dashboard",
            "/sites",
            "/customers",
            "/pra-users",
            "/bt-backups",
            "/logs",
        ];
        this.showInstanceSelector = !hiddenRoutes.some((route) =>
            url.startsWith(route),
        );
    }

    /**
     * Returns instances visible to the current user.
     * SuperAdmin sees all; Admins see only their BU + shared (null) instances.
     */
    public get filteredInstances(): BeyondtrustInstance[] {
        const user = this.currentUser;
        if (!user || user.role === AuthRole.SUPER_ADMIN) {
            return this.instances;
        }
        return this.instances.filter(
            (i) =>
                i.businessUnit === null || i.businessUnit === user.businessUnit,
        );
    }

    /**
     * Handles instance selection change
     */
    public onInstanceChange(instanceId: number): void {
        this.appService.setSelectedInstanceId(instanceId);
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
                { transitionClass: true },
            );
        }

        // * --> compact
        this.layout.publishLayoutChange(
            {
                sidebarStyle: "compact",
                sidebarCompactToggle: true,
            },
            { transitionClass: true },
        );
    }

    public logoutUser(): void {
        this.jwtAuthService.signout();
    }
}
