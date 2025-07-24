import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
    ConsoleUser,
    ConsoleUserAddDto,
    ConsoleUserDefaultResponse,
    ConsoleUserSummaryResponse,
    ConsoleUserUpdateDto,
} from "../models";

@Injectable()
export class ConsoleUserService {
    constructor(private http: HttpClient) {}

    public async findAllConsoleUser(): Promise<ConsoleUser[]> {
        const result = await firstValueFrom(
            this.http.get<ConsoleUserSummaryResponse>("user/summary")
        );

        return Promise.resolve(result.message.users);
    }

    public async createConsoleUser(
        consoleUser: ConsoleUserAddDto
    ): Promise<ConsoleUserDefaultResponse> {
        return await firstValueFrom(
            this.http.post<ConsoleUserDefaultResponse>(
                "user/console-create",
                consoleUser
            )
        );
    }

    public async updateConsoleUser(
        consoleUser: ConsoleUserUpdateDto
    ): Promise<ConsoleUserDefaultResponse> {
        return await firstValueFrom(
            this.http.put<ConsoleUserDefaultResponse>(
                "user/console-update",
                consoleUser
            )
        );
    }

    public async deleteConsoleUser(
        userId: number
    ): Promise<ConsoleUserDefaultResponse> {
        return await firstValueFrom(
            this.http.delete<ConsoleUserDefaultResponse>(
                `user/console-remove/${userId}`
            )
        );
    }
}
