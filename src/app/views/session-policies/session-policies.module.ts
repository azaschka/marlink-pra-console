import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SessionPoliciesService } from "./session-policies.service";

@NgModule({
    imports: [CommonModule],
    providers: [SessionPoliciesService],
})
export class SessionPoliciesModule {}
