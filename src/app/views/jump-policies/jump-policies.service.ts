import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { JumpPolicy } from "./models";

@Injectable()
export class JumpPoliciesService {
    constructor(private readonly http: HttpClient) {}

    public async fetchJumpPolicies(): Promise<JumpPolicy[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<JumpPolicy[]>("jump-policies", { params })
        );
    }
}
