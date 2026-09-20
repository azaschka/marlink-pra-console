import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { BtBackup } from "./models";
import { PraApiDefaults } from "../../shared/config";

@Injectable()
export class BtBackupsService {
    constructor(private http: HttpClient) {}

    public async fetchBackups(instanceId: number): Promise<BtBackup[]> {
        const params = new HttpParams().set(
            "pageSize",
            PraApiDefaults.FETCH_ALL_PAGE_SIZE
        );
        return firstValueFrom(
            this.http.get<BtBackup[]>(
                `/beyondtrust-instances/${instanceId}/backups`,
                { params }
            )
        );
    }

    public async createBackup(instanceId: number): Promise<BtBackup> {
        return firstValueFrom(
            this.http.post<BtBackup>(
                `/beyondtrust-instances/${instanceId}/backups`,
                {}
            )
        );
    }

    public async fetchBackupMeta(
        instanceId: number,
        backupId: number
    ): Promise<BtBackup> {
        return firstValueFrom(
            this.http.get<BtBackup>(
                `/beyondtrust-instances/${instanceId}/backups/${backupId}`
            )
        );
    }

    public async downloadBackup(
        instanceId: number,
        backupId: number
    ): Promise<Blob> {
        return firstValueFrom(
            this.http.get(
                `/beyondtrust-instances/${instanceId}/backups/${backupId}/content`,
                { responseType: "blob" }
            )
        );
    }
}
