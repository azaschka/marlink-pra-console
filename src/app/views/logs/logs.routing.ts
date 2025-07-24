import { Routes } from "@angular/router";

import { LogsComponent } from "./logs.component";

export const LogsRoutes: Routes = [
    {
        path: "",
        component: LogsComponent,
        data: { title: "System Log", breadcrumb: "System Log" },
    },
];
