import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    BeyondtrustInstance,
    CreateBeyondtrustInstanceDto,
    ModifyBeyondtrustInstanceDto,
    RetrieveBeyondtrustInstancesParams,
} from "./models";

@Injectable({ providedIn: "root" })
export class BeyondtrustInstancesService {
    private readonly baseEndpoint = "beyondtrust-instances";

    constructor(private readonly http: HttpClient) {}

    /**
     * Retrieves a single BeyondTrust instance by ID
     * @param id Instance ID
     * @returns Promise of BeyondtrustInstance
     */
    public async fetchById(id: number): Promise<BeyondtrustInstance> {
        return await firstValueFrom(
            this.http.get<BeyondtrustInstance>(`${this.baseEndpoint}/${id}`),
        );
    }

    /**
     * Retrieves a paginated list of BeyondTrust instances with optional filters
     * @param params Query parameters for filtering and pagination
     * @returns Promise of BeyondtrustInstance array
     */
    public async fetchAll(
        params?: RetrieveBeyondtrustInstancesParams,
    ): Promise<BeyondtrustInstance[]> {
        const httpParams = this.buildQueryParams(params);

        return await firstValueFrom(
            this.http.get<BeyondtrustInstance[]>(this.baseEndpoint, {
                params: httpParams,
            }),
        );
    }

    /**
     * Creates a new BeyondTrust instance
     * @param dto Data transfer object with instance details
     * @returns Promise of created BeyondtrustInstance
     */
    public async create(
        dto: CreateBeyondtrustInstanceDto,
    ): Promise<BeyondtrustInstance> {
        return await firstValueFrom(
            this.http.post<BeyondtrustInstance>(this.baseEndpoint, dto),
        );
    }

    /**
     * Updates an existing BeyondTrust instance (partial update)
     * @param id Instance ID
     * @param dto Data transfer object with fields to update
     * @returns Promise of updated BeyondtrustInstance
     */
    public async update(
        id: number,
        dto: ModifyBeyondtrustInstanceDto,
    ): Promise<BeyondtrustInstance> {
        return await firstValueFrom(
            this.http.patch<BeyondtrustInstance>(
                `${this.baseEndpoint}/${id}`,
                dto,
            ),
        );
    }

    /**
     * Deletes a BeyondTrust instance
     * @param id Instance ID
     * @returns Promise<void> (204 No Content on success)
     */
    public async delete(id: number): Promise<void> {
        return firstValueFrom(
            this.http.delete<void>(`${this.baseEndpoint}/${id}`),
        );
    }

    // ============ Private Helper Methods ============

    /**
     * Builds HttpParams from query parameters object
     * @param params Query parameters
     * @returns HttpParams instance
     */
    private buildQueryParams(
        params?: RetrieveBeyondtrustInstancesParams,
    ): HttpParams {
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
                params.pageNumber.toString(),
            );
        }

        // Add filter params
        if (params.name) {
            httpParams = httpParams.set("name", params.name);
        }
        if (params.oauth2TokenUrl) {
            httpParams = httpParams.set(
                "oauth2TokenUrl",
                params.oauth2TokenUrl,
            );
        }
        if (params.apiBaseUrl) {
            httpParams = httpParams.set("apiBaseUrl", params.apiBaseUrl);
        }

        if (params.businessUnits?.length) {
            params.businessUnits.forEach((bu) => {
                httpParams = httpParams.append("businessUnits", bu);
            });
        }

        return httpParams;
    }
}
