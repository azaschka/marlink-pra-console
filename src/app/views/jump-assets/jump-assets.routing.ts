import { Routes } from "@angular/router";

import { JumpAssetsComponent } from "./jump-assets.component";

export const JumpAssetsRoutes: Routes = [
    {
        path: "",
        component: JumpAssetsComponent,
        data: { title: "Jump Assets", breadcrumb: "Jump Assets" },
    },
];
