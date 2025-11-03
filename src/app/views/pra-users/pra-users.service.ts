import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { PraUser, PraUserCreateRequest, PraUserUpdateRequest } from "./models";

@Injectable()
export class PraUsersService {
    constructor(private http: HttpClient) {}

    public async fetchPraUsers(): Promise<PraUser[]> {
        const params = new HttpParams().set("pageSize", "9999");
        return firstValueFrom(
            this.http.get<PraUser[]>("pra-users", { params }),
        );
    }

    public async createPraUser(body: PraUserCreateRequest): Promise<PraUser> {
        return firstValueFrom(this.http.post<PraUser>("pra-users", body));
    }

    public async updatePraUser(
        id: number,
        body: PraUserUpdateRequest,
    ): Promise<PraUser> {
        return firstValueFrom(
            this.http.patch<PraUser>(`pra-users/${id}`, body),
        );
    }

    public async deletePraUser(id: number): Promise<void> {
        return firstValueFrom(this.http.delete<void>(`pra-users/${id}`));
    }
}
