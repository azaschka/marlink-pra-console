import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { config } from "config";
import { AuthRole } from "../enums";

export type MenuItemType =
    | "link"
    | "dropDown"
    | "icon"
    | "separator"
    | "extLink";

export interface IMenuItem {
    type: MenuItemType;
    name?: string; // Used as display text for item and title for separator type
    state?: string; // Router state
    icon?: string; // Material icon name
    svgIcon?: string; // UI Lib icon name
    tooltip?: string; // Tooltip text
    disabled?: boolean; // If true, item will not be appeared in sidenav.
    sub?: IChildItem[]; // Dropdown items
    badges?: IBadge[];
    roles: Array<AuthRole | string>; // AuthRole enum values or special permission strings
}

export interface IChildItem {
    type?: string;
    name: string; // Display text
    state?: string; // Router state
    icon?: string; // Material icon name
    svgIcon?: string; // UI Lib icon name
    sub?: IChildItem[];
}

export interface IBadge {
    color: string; // primary/accent/warn/hex color codes(#fff000)
    value: string; // Display text
}

/**
 * Service for managing application navigation menu items.
 * Provides menu configuration with role-based access control.
 */
@Injectable()
export class NavigationService {
    /**
     * Special permission identifier for users who can manage PRA users
     * This is not an AuthRole but a user-level permission flag
     */
    public static readonly CAN_MANAGE_PRA_USERS_PERMISSION =
        "canManagePraUsers";

    /**
     * Icon menu title displayed at the top of navigation
     * when icon type items are present in the menu
     */
    public readonly iconTypeMenuTitle = "Frequently Accessed";

    private readonly defaultMenu: IMenuItem[] = [
        {
            name: "Dashboard",
            type: "link",
            icon: "dashboard",
            state: "dashboard",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            type: "separator",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
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
            name: "views.jumpoints.headline",
            type: "link",
            icon: "lan",
            state: "jumpoints",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            name: "views.jump-groups.headline",
            type: "link",
            icon: "account_tree",
            state: "jump-groups",
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
            name: "views.jump-client-installers.headline",
            type: "link",
            icon: "device_hub",
            state: "jump-client-installers",
            roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
        },
        {
            type: "separator",
            roles: [
                AuthRole.SUPER_ADMIN,
                NavigationService.CAN_MANAGE_PRA_USERS_PERMISSION,
            ],
        },
        {
            name: "views.pra-users.headline",
            type: "link",
            icon: "manage_accounts",
            state: "pra-users",
            roles: [
                AuthRole.SUPER_ADMIN,
                NavigationService.CAN_MANAGE_PRA_USERS_PERMISSION,
            ],
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

    private readonly menuItems = new BehaviorSubject<IMenuItem[]>(
        this.defaultMenu
    );

    /**
     * Observable stream of menu items
     * Components should subscribe to this to receive menu updates
     */
    public readonly menuItems$: Observable<IMenuItem[]> =
        this.menuItems.asObservable();

    /**
     * Get the current menu items value
     */
    public getMenuItems(): IMenuItem[] {
        return this.menuItems.value;
    }

    /**
     * Update the menu items
     * @param items New menu items to set
     */
    public setMenuItems(items: IMenuItem[]): void {
        this.menuItems.next(items);
    }

    /**
     * Reset menu items to default
     */
    public resetToDefault(): void {
        this.menuItems.next(this.defaultMenu);
    }
}
