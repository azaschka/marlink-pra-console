import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { HealthCheckResponse } from "./models";

@Injectable({ providedIn: "root" })
export class HealthService {
    private readonly baseEndpoint = "health";

    constructor(private readonly http: HttpClient) {}

    /**
     * Retrieves the health status of the application and its dependencies
     * @returns Promise of HealthCheckResponse
     */
    public async checkHealth(): Promise<HealthCheckResponse> {
        return await firstValueFrom(
            this.http.get<HealthCheckResponse>(this.baseEndpoint)
        );
    }
}
