import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { JumpGroupsService } from "./jump-groups.service";

@NgModule({
    imports: [CommonModule],
    providers: [JumpGroupsService],
})
export class JumpGroupsModule {}
