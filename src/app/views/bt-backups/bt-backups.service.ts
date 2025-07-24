import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { BtBackup } from "./models";

@Injectable()
export class BtBackupsService {
    constructor(private http: HttpClient) {}

    public async fetchBackups(instanceId: number): Promise<BtBackup[]> {
        return firstValueFrom(
            this.http.get<BtBackup[]>(
                `/beyondtrust-instances/${instanceId}/backups`
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
