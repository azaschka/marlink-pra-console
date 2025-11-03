import { Routes } from "@angular/router";

import { JumpGroupsComponent } from "./jump-groups.component";

export const JumpGroupsRoutes: Routes = [
    {
        path: "",
        component: JumpGroupsComponent,
        data: { title: "Jump Groups", breadcrumb: "Jump Groups" },
    },
];
