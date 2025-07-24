import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { config } from "config";
import { AuthRole } from "../enums";

export interface IMenuItem {
    type: "link" | "dropDown" | "icon" | "separator" | "extLink";
    name?: string; // Used as display text for item and title for separator type
    state?: string; // Router state
    icon?: string; // Material icon name
    svgIcon?: string; // UI Lib icon name
    tooltip?: string; // Tooltip text
    disabled?: boolean; // If true, item will not be appeared in sidenav.
    sub?: IChildItem[]; // Dropdown items
    badges?: IBadge[];
    roles: string[];
}
interface IChildItem {
    type?: string;
    name: string; // Display text
    state?: string; // Router state
    icon?: string; // Material icon name
    svgIcon?: string; // UI Lib icon name
    sub?: IChildItem[];
}

interface IBadge {
    color: string; // primary/accent/warn/hex color codes(#fff000)
    value: string; // Display text
}

@Injectable()
export class NavigationService {
    defaultMenu: IMenuItem[] = [
        {
            name: "Dashboard",
            type: "link",
            icon: "dashboard",
            state: "dashboard",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        { type: "separator", roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN] },
        {
            name: "Sites",
            type: "link",
            icon: "location_on",
            state: "sites",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            name: "Customers",
            type: "link",
            icon: "business",
            state: "customers",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            name: "views.users.headline",
            type: "link",
            icon: "group",
            state: "users",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            name: "views.group-policies.headline",
            type: "link",
            icon: "policy",
            state: "group-policies",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            name: "views.jump-assets.headline",
            type: "link",
            icon: "device_hub",
            state: "jump-assets",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            type: "separator",
            roles: [AuthRole.SUPER_ADMIN],
        },
        {
            name: "views.pra-users.headline",
            type: "link",
            icon: "manage_accounts",
            state: "pra-users",
            roles: [AuthRole.SUPER_ADMIN],
        },
        {
            name: "views.bt-backups.headline",
            type: "link",
            icon: "settings_backup_restore",
            state: "bt-backups",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.DATA_CENTER_ENGINEER],
        },
        {
            name: "views.logs.headline",
            type: "link",
            icon: "list_alt",
            state: "logs",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.DATA_CENTER_ENGINEER],
        },
        {
            type: "separator",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.DATA_CENTER_ENGINEER],
        },
        {
            name: "API Documentation",
            type: "extLink",
            tooltip: "API Documentation",
            icon: "library_books",
            state: `${config.praApiBaseUrl}/open-api`,
            roles: [AuthRole.SUPER_ADMIN, AuthRole.DATA_CENTER_ENGINEER],
        },
    ];

    // Icon menu TITLE at the very top of navigation.
    // This title will appear if any icon type item is present in menu.
    iconTypeMenuTitle = "Frequently Accessed";

    // sets iconMenu as default;
    menuItems = new BehaviorSubject<IMenuItem[]>(this.defaultMenu);

    // navigation component has subscribed to this Observable
    menuItems$ = this.menuItems.asObservable();

    constructor() {}
}
