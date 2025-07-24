import { Component, OnInit, OnDestroy } from "@angular/core";
import { NavigationService } from "../../../shared/services/navigation.service";
import { Subscription } from "rxjs";

@Component({
    selector: "app-sidebar-top",
    templateUrl: "./sidebar-top.component.html",
})
export class SidebarTopComponent implements OnInit, OnDestroy {
    public menuItems: any[];
    private menuItemsSub: Subscription;
    constructor(private navService: NavigationService) {}

    ngOnInit() {
        this.menuItemsSub = this.navService.menuItems$.subscribe((menuItem) => {
            this.menuItems = menuItem.filter(
                (item) => item.type !== "icon" && item.type !== "separator"
            );
        });
    }
    ngOnDestroy() {
        if (this.menuItemsSub) {
            this.menuItemsSub.unsubscribe();
        }
    }
}
