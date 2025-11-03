import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

interface BeyondTrustInstance {
    id: number;
    name: string;
    authClientId: string;
    authClientSecret: string;
    oauth2TokenUrl: string;
    apiBaseUrl: string;
    backupApiUrl: string;
    creationDate: Date;
    lastModificationDate?: Date;
}

@Injectable()
export class AppService {
    constructor(private readonly http: HttpClient) {}

    public async fetchDefaultBeyondTrustInstanceApiBaseUrl(): Promise<string> {
        const instances = await this.fetchBeyondTrustInstances();
        const defaultInstance = instances[0];
        const baseUrl = new URL(defaultInstance.apiBaseUrl);

        return `${baseUrl.protocol}//${baseUrl.host}`;
    }

    public async fetchBeyondTrustInstances(): Promise<BeyondTrustInstance[]> {
        return firstValueFrom(
            this.http.get<BeyondTrustInstance[]>("beyondtrust-instances")
        );
    }
}
