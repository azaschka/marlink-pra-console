import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ResetDataResult } from "./models";

@Injectable({ providedIn: "root" })
export class DangerZoneService {
    private readonly baseEndpoint = "maintenance";

    constructor(private readonly http: HttpClient) {}

    /**
     * Dry-run: returns the tables that would be truncated without changing
     * anything.
     */
    public async previewReset(): Promise<ResetDataResult> {
        return await firstValueFrom(
            this.http.post<ResetDataResult>(`${this.baseEndpoint}/reset-data`, {
                dryRun: true,
            })
        );
    }

    /**
     * Executes the destructive data reset. Requires the confirmation phrase.
     */
    public async resetData(confirm: string): Promise<ResetDataResult> {
        return await firstValueFrom(
            this.http.post<ResetDataResult>(`${this.baseEndpoint}/reset-data`, {
                confirm,
            })
        );
    }
}
