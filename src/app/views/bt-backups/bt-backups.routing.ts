import { Routes } from "@angular/router";
import { BtBackupsComponent } from "./bt-backups.component";

export const BtBackupsRoutes: Routes = [
    {
        path: "",
        component: BtBackupsComponent,
        data: { title: "Backups", breadcrumb: "Backups" },
    },
];
