export enum ImportState {
    Idle = "idle",
    Preview = "preview",
    Importing = "importing",
    Success = "success",
    Error = "error",
}

export enum ImportStatus {
    Pending = "pending",
    InProgress = "in-progress",
    Success = "success",
    Warning = "warning",
    Error = "error",
}

export interface ImportStep {
    label: string;
    status: ImportStatus;
    result?: string;
    /** One line per affected item, for example per site user the PRA API could not process. */
    details?: string[];
}
