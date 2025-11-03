import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { firstValueFrom, map } from "rxjs";
import { Log, RetrieveLogsParams } from "./models";
import { PagedResult } from "../../shared/models";
import { LogActionType } from "./enums";

interface LogRetrievedDtoOutput {
    id: number;
    serviceName: string;
    actionType: string;
    actionName: string;
    transactionId: string;
    initiatedBy?: string;
    creationDate: string;
    payload: string;
}

interface LogsRetrievedDtoOutput {
    totalCount: number;
    logs: LogRetrievedDtoOutput[];
}

@Injectable()
export class LogsService {
    private static readonly DEFAULT_PAGE_SIZE = 25;

    constructor(private readonly http: HttpClient) {}

    public async fetchLogs(
        params: RetrieveLogsParams = {}
    ): Promise<PagedResult<Log>> {
        let qp = new HttpParams();

        if (params.pageSize != null)
            qp = qp.set("pageSize", String(params.pageSize));
        if (params.pageNumber != null)
            qp = qp.set("pageNumber", String(params.pageNumber));
        if (params.creationDateFrom)
            qp = qp.set(
                "creationDateFrom",
                params.creationDateFrom.toISOString()
            );
        if (params.creationDateTo)
            qp = qp.set("creationDateTo", params.creationDateTo.toISOString());
        if (params.sortOrderType != null)
            qp = qp.set("sortOrderType", params.sortOrderType);

        return firstValueFrom(
            this.http.get<LogsRetrievedDtoOutput>("logs", { params: qp }).pipe(
                map((resp) => {
                    const items: Log[] = (resp.logs ?? []).map(
                        this.mapDtoToDomain
                    );
                    return {
                        items,
                        total: resp.totalCount ?? items.length,
                        page: params.pageNumber ?? 1,
                        pageSize:
                            params.pageSize ?? LogsService.DEFAULT_PAGE_SIZE,
                    };
                })
            )
        );
    }

    public async clearLogs(
        creationDateFrom?: Date,
        creationDateTo?: Date
    ): Promise<void> {
        let params = new HttpParams();

        if (creationDateFrom) {
            params = params.set(
                "creationDateFrom",
                creationDateFrom.toISOString()
            );
        }

        if (creationDateTo) {
            params = params.set("creationDateTo", creationDateTo.toISOString());
        }

        return firstValueFrom(this.http.delete<void>("logs", { params }));
    }

    private mapDtoToDomain = (d: LogRetrievedDtoOutput): Log => ({
        id: d.id,
        serviceName: d.serviceName,
        actionType: this.parseActionType(d.actionType),
        actionName: d.actionName,
        transactionId: d.transactionId,
        initiatedBy: d.initiatedBy,
        creationDate: new Date(d.creationDate),
        payload: d.payload,
    });

    private parseActionType(v: string): LogActionType {
        // robustes Enum-Mapping (case-insensitive, fallback auf Info/Unknown je nach Enum)
        const normalized = (v ?? "").toUpperCase();
        // Wenn dein Enum Werte wie 'Info' | 'Error' hat, passe das Mapping hier an:
        // Beispiel:
        // if (normalized === 'ERROR') return LogActionType.Error;
        // if (normalized === 'INFO')  return LogActionType.Info;
        // Fallback:
        return (
            (LogActionType as any)[normalized] ??
            (LogActionType as any).Info ??
            (v as any)
        );
    }
}
