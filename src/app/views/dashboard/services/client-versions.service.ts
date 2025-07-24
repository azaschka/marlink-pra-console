import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    ClientVersionAddDto,
    ClientVersions,
    ClientVersionsDefaultResponse,
    ClientVersionsSummaryResponse,
} from "../models";

@Injectable()
export class ClientVersionsService {
    constructor(private http: HttpClient) {}

    public async findLatestClientVersions(): Promise<ClientVersions> {
        const result = await firstValueFrom(
            this.http.get<ClientVersionsSummaryResponse>(
                "client-versions-summary"
            )
        );

        return Promise.resolve(result.message.summary);
    }

    public async addClientVersions(
        clientVersions: ClientVersionAddDto
    ): Promise<ClientVersionsDefaultResponse> {
        return await firstValueFrom(
            this.http.post<ClientVersionsDefaultResponse>(
                "add-client-versions",
                clientVersions
            )
        );
    }
}
