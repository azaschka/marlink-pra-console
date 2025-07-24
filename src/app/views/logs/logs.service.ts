import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { firstValueFrom, map } from "rxjs";
import { Log, RetrieveLogsParams } from "./models";
import { PagedResult } from "../../shared/models";

@Injectable()
export class LogsService {
    private static readonly DEFAULT_PAGE_SIZE = 25;

    constructor(private readonly http: HttpClient) {}

    public async fetchLogs(
        params: RetrieveLogsParams = {}
    ): Promise<PagedResult<Log>> {
        let qp = new HttpParams();

        if (params.pageSize != null)
            qp = qp.set("pageSize", params.pageSize.toString());
        if (params.pageNumber != null)
            qp = qp.set("pageNumber", params.pageNumber.toString());
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
            this.http
                .get<Log[]>("logs", { params: qp, observe: "response" })
                .pipe(
                    map((resp: HttpResponse<Log[]>) => ({
                        items: resp.body ?? [],
                        total: +(
                            resp.headers.get("X-Total-Count") ||
                            resp.body?.length ||
                            0
                        ),
                        page: params.pageNumber ?? 1,
                        pageSize:
                            params.pageSize ?? LogsService.DEFAULT_PAGE_SIZE,
                    }))
                )
        );
    }

    public async clearLogs(
        creationDateFrom?: Date,
        creationDateTo?: Date
    ): Promise<void> {
        const params = new HttpParams();
        if (creationDateFrom) {
            params.set("creationDateFrom", creationDateFrom.toISOString());
        }
        if (creationDateTo) {
            params.set("creationDateTo", creationDateTo.toISOString());
        }

        return firstValueFrom(this.http.delete<void>("logs", { params }));
    }
}
