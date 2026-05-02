import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { PraUser, PraUserCreateRequest, PraUserUpdateRequest } from "./models";
import { TenantCache } from "../../shared/helpers/tenant-cache";

@Injectable()
export class PraUsersService {
    /**
     * Pra-users are not tenant-scoped, so a single constant cache key is used.
     * The cache is invalidated automatically after any mutation so that the
     * next read always returns fresh data.
     */
    private readonly cache = new TenantCache<PraUser[]>();
    private static readonly CACHE_KEY = 0;

    constructor(private http: HttpClient) {}

    public fetchPraUsers(): Promise<PraUser[]> {
        return this.cache.get(PraUsersService.CACHE_KEY, () => {
            const params = new HttpParams().set("pageSize", "9999");
            return firstValueFrom(this.http.get<PraUser[]>("pra-users", { params }));
        });
    }

    public async createPraUser(body: PraUserCreateRequest): Promise<PraUser> {
        const result = await firstValueFrom(this.http.post<PraUser>("pra-users", body));
        // Invalidate so the next fetchPraUsers() call returns fresh data.
        this.cache.invalidate();
        return result;
    }

    public async updatePraUser(id: number, body: PraUserUpdateRequest): Promise<PraUser> {
        const result = await firstValueFrom(this.http.patch<PraUser>(`pra-users/${id}`, body));
        this.cache.invalidate();
        return result;
    }

    public async deletePraUser(id: number): Promise<void> {
        await firstValueFrom(this.http.delete<void>(`pra-users/${id}`));
        this.cache.invalidate();
    }
}
