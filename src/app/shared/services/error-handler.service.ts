import { ErrorHandler, Injectable } from "@angular/core";

@Injectable()
export class ErrorHandlerService implements ErrorHandler {
    public handleError(error: unknown): void {
        const normalizedError = this.normalizeError(error);
        console.error("[ErrorHandlerService] Unhandled error:", normalizedError);
    }

    private normalizeError(error: unknown): Error {
        if (error instanceof Error) {
            return error;
        }

        return new Error(typeof error === "string" ? error : JSON.stringify(error));
    }
}
