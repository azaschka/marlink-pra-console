import { Routes } from "@angular/router";
import { AdminLayoutComponent } from "./shared/components/layouts/admin-layout/admin-layout.component";
import { AuthLayoutComponent } from "./shared/components/layouts/auth-layout/auth-layout.component";
import { AuthRole } from "./shared/enums";
import { AuthGuard } from "./shared/guards/auth.guard";
import { UserRoleGuard } from "./shared/guards/user-role.guard";

export const AppRoutes: Routes = [
    {
        path: "",
        redirectTo: "sites",
        pathMatch: "full",
    },
    {
        path: "",
        component: AuthLayoutComponent,
        children: [
            {
                path: "sessions",
                loadChildren: () =>
                    import("./views/sessions/sessions.module").then(
                        (m) => m.SessionsModule
                    ),
                data: { title: "Session" },
            },
        ],
    },
    {
        path: "",
        component: AdminLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: "dashboard",
                loadChildren: () =>
                    import("./views/dashboard/dashboard.module").then(
                        (m) => m.DashboardModule
                    ),
                data: {
                    title: "Dashboard",
                    breadcrumb: "views.dashboard.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "sites",
                loadChildren: () =>
                    import("./views/sites/sites.module").then(
                        (m) => m.SitesModule
                    ),
                data: {
                    title: "Sites",
                    breadcrumb: "views.sites.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "customers",
                loadChildren: () =>
                    import("./views/customers/customers.module").then(
                        (m) => m.CustomersModule
                    ),
                data: {
                    title: "Customers",
                    breadcrumb: "views.customers.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "users",
                loadChildren: () =>
                    import("./views/users/users.module").then(
                        (m) => m.UsersModule
                    ),
                data: {
                    title: "Users",
                    breadcrumb: "views.users.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "group-policies",
                loadChildren: () =>
                    import("./views/group-policies/group-policies.module").then(
                        (m) => m.GroupPoliciesModule
                    ),
                data: {
                    title: "Group Policies",
                    breadcrumb: "views.group-policies.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "jump-assets",
                loadChildren: () =>
                    import("./views/jump-assets/jump-assets.module").then(
                        (m) => m.JumpAssetsModule
                    ),
                data: {
                    title: "Jump Assets",
                    breadcrumb: "views.jump-assets.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "pra-users",
                loadChildren: () =>
                    import("./views/pra-users/pra-users.module").then(
                        (m) => m.PraUsersModule
                    ),
                data: {
                    title: "PRA Users",
                    breadcrumb: "views.pra-users.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "bt-backups",
                loadChildren: () =>
                    import("./views/bt-backups/bt-backups.module").then(
                        (m) => m.BtBackupsModule
                    ),
                data: {
                    title: "BT Backups",
                    breadcrumb: "views.bt-backups.headline",
                    roles: [AuthRole.SUPER_ADMIN, AuthRole.ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
            {
                path: "logs",
                loadChildren: () =>
                    import("./views/logs/logs.module").then(
                        (m) => m.LogsModule
                    ),
                data: {
                    title: "System Log",
                    breadcrumb: "views.logs.headline",
                    roles: [AuthRole.SUPER_ADMIN],
                },
                canActivate: [UserRoleGuard],
            },
        ],
    },
    {
        path: "**",
        redirectTo: "sessions/404",
    },
];
