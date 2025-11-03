import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { JumpGroup } from "./models/jump-group.model";
import { JumpGroupUpdateRequest } from "./models";

@Injectable()
export class JumpGroupsService {
    constructor(private readonly http: HttpClient) {}

    public async fetchJumpGroups(): Promise<JumpGroup[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<JumpGroup[]>("jump-groups", { params })
        );
    }

    public async updateJumpGroup(
        id: number,
        body: JumpGroupUpdateRequest
    ): Promise<JumpGroup> {
        return firstValueFrom(
            this.http.patch<JumpGroup>(`jump-groups/${id}`, body)
        );
    }

    public async deleteJumpGroup(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`jump-groups/${id}`));
    }
}
