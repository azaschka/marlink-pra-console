import { Routes } from "@angular/router";
import { SitesComponent } from "./sites.component";

export const SitesRoutes: Routes = [
    {
        path: "",
        component: SitesComponent,
        data: { title: "Sites", breadcrumb: "Sites" },
    },
];
