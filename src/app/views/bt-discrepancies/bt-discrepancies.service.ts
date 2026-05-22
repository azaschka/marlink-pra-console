import { Injectable } from "@angular/core";
import { BtApiDefaults } from "../../shared/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import {
    Discrepancy,
    RetrieveDiscrepanciesParams,
    ScanStartedResponse,
    ScanStatusResponse,
    SyncDiscrepancyRequest,
} from "./models";

@Injectable()
export class BtDiscrepanciesService {
    constructor(private readonly http: HttpClient) {}

    private createHeaders(tenantId: number) {
        return { headers: { "X-Tenant-Id": tenantId.toString() } };
    }

    public async fetchDiscrepancies(
        tenantId: number,
        params: RetrieveDiscrepanciesParams = {},
    ): Promise<Discrepancy[]> {
        let httpParams = new HttpParams();
        httpParams = httpParams.set("pageSize", BtApiDefaults.FETCH_ALL_PAGE_SIZE);

        if (params.pageSize !== undefined) {
            httpParams = httpParams.set("pageSize", params.pageSize.toString());
        }
        if (params.pageNumber !== undefined) {
            httpParams = httpParams.set("pageNumber", params.pageNumber.toString());
        }
        if (params.entityType !== undefined) {
            httpParams = httpParams.set("entityType", params.entityType);
        }
        if (params.entityId !== undefined) {
            httpParams = httpParams.set("entityId", params.entityId.toString());
        }

        return firstValueFrom(
            this.http.get<Discrepancy[]>("discrepancies", {
                params: httpParams,
                ...this.createHeaders(tenantId),
            }),
        );
    }

    public async scanAllDiscrepancies(tenantId: number): Promise<ScanStartedResponse> {
        return firstValueFrom(
            this.http.post<ScanStartedResponse>("discrepancies/scan/all", {}, this.createHeaders(tenantId)),
        );
    }

    public getScanStatus(tenantId: number, scanId: string): Observable<ScanStatusResponse> {
        return this.http.get<ScanStatusResponse>(`discrepancies/scan/status/${scanId}`, this.createHeaders(tenantId));
    }

    public async syncAllExternalDiscrepancies(
        tenantId: number,
    ): Promise<{ total: number; synced: number; failed: number }> {
        return firstValueFrom(
            this.http.post<{ total: number; synced: number; failed: number }>(
                "discrepancies/sync/all-external",
                {},
                this.createHeaders(tenantId),
            ),
        );
    }

    public async syncDiscrepancy(
        tenantId: number,
        discrepancyId: number,
        request: SyncDiscrepancyRequest,
    ): Promise<void> {
        return firstValueFrom(
            this.http.post<void>(`discrepancies/${discrepancyId}/sync`, request, this.createHeaders(tenantId)),
        );
    }
}
