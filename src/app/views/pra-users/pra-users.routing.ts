import { Routes } from "@angular/router";
import { PraUsersComponent } from "./pra-users.component";

export const PraUsersRoutes: Routes = [
    {
        path: "",
        component: PraUsersComponent,
        data: { title: "PRA Users", breadcrumb: "PRA Users" },
    },
];
