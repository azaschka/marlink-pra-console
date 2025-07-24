import { ConsoleUser } from "../console-user.model";

export interface ConsoleUserSummaryResponse {
    statusCode: number;
    message: {
        users: ConsoleUser[];
    };
}
