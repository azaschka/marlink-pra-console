import { LogActionType } from "../enums";

export interface Log {
    id: number;
    serviceName: string;
    actionType: LogActionType;
    actionName: string;
    transactionId: string;
    initiatedBy?: string;
    creationDate: Date;
    payload: string;
}
