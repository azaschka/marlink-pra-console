import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    AccessKey,
    CreateAccessKeyDto,
    ModifyAccessKeyDto,
    RetrieveAccessKeyParams,
} from "./models";

@Injectable({ providedIn: "root" })
export class AccessKeysService {
    private readonly baseEndpoint = "access";

    constructor(private readonly http: HttpClient) {}

    /**
     * Retrieves a single Access Key by ID
     * @param id Access Key Id
     * @returns Promise of AccessKey
     */
    public async fetchById(id: number): Promise<AccessKey> {
        return await firstValueFrom(
            this.http.get<AccessKey>(`${this.baseEndpoint}/${id}`)
        );
    }

    /**
     * Retrieves a paginated list of Access Keys with optional filters
     * @param params Query parameters for filtering and pagination
     * @returns Promise of AccessKey array
     */
    public async fetchAll(
        params?: RetrieveAccessKeyParams
    ): Promise<AccessKey[]> {
        const httpParams = this.buildQueryParams(params);

        return await firstValueFrom(
            this.http.get<AccessKey[]>(this.baseEndpoint, {
                params: httpParams,
            })
        );
    }

    /**
     * Creates a new Access Key
     * @param dto Data transfer object with Access Key details
     * @returns Promise of created AccessKey
     */
    public async create(dto: CreateAccessKeyDto): Promise<AccessKey> {
        return await firstValueFrom(
            this.http.post<AccessKey>(this.baseEndpoint, dto)
        );
    }

    /**
     * Updates an Access Key by ID
     * @param id Access Key Id
     * @param dto Data transfer object with Access Key details
     * @returns Promise of updated AccessKey
     */
    public async update(
        id: number,
        dto: ModifyAccessKeyDto
    ): Promise<AccessKey> {
        return await firstValueFrom(
            this.http.patch<AccessKey>(`${this.baseEndpoint}/${id}`, dto)
        );
    }

    /**
     * Deletes an Access Key by ID
     * @param id Access Key Id
     * @returns Promise<void> (204 No Content on success)
     */
    public async delete(id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(`${this.baseEndpoint}/${id}`)
        );
    }

    // ============ Private Helper Methods ============

    /**
     * Builds HttpParams from query parameters object
     * @param params Query parameters
     * @returns HttpParams instance
     */
    private buildQueryParams(params?: RetrieveAccessKeyParams): HttpParams {
        let httpParams = new HttpParams();

        if (!params) {
            return httpParams;
        }

        // Add pagination params (default: pageSize=100, pageNumber=1)
        if (params.pageSize !== undefined) {
            httpParams = httpParams.set("pageSize", params.pageSize.toString());
        }
        if (params.pageNumber !== undefined) {
            httpParams = httpParams.set(
                "pageNumber",
                params.pageNumber.toString()
            );
        }

        // Add filter params
        if (params.name) {
            httpParams = httpParams.set("name", params.name);
        }
        if (params.key) {
            httpParams = httpParams.set("key", params.key);
        }

        return httpParams;
    }
}
