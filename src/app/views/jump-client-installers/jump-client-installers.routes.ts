import { Routes } from "@angular/router";

import { JumpClientInstallersComponent } from "./jump-client-installers.component";

export const JumpClientInstallersRoutes: Routes = [
    {
        path: "",
        component: JumpClientInstallersComponent,
        data: {
            title: "Jump Client Installers",
            breadcrumb: "Jump Client Installers",
        },
    },
];
