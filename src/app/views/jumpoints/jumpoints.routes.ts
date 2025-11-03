import { Routes } from "@angular/router";

import { JumpointsComponent } from "./jumpoints.component";

export const JumpointsRoutes: Routes = [
    {
        path: "",
        component: JumpointsComponent,
        data: { title: "Jump Points", breadcrumb: "Jump Points" },
    },
];
