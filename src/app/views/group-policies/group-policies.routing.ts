import { Routes } from "@angular/router";

import { GroupPoliciesComponent } from "./group-policies.component";

export const GroupPoliciesRoutes: Routes = [
    {
        path: "",
        component: GroupPoliciesComponent,
        data: { title: "Group Policies", breadcrumb: "Group Policies" },
    },
];
