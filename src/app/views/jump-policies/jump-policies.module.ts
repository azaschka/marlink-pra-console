import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { JumpPoliciesService } from "./jump-policies.service";

@NgModule({
    imports: [CommonModule],
    providers: [JumpPoliciesService],
})
export class JumpPoliciesModule {}
