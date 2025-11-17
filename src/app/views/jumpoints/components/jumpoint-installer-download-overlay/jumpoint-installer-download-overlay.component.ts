import { Component, Inject } from "@angular/core";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NotificationDialogService } from "../../../../shared/dialogs/notification-dialog/notification-dialog.service";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { JumpointsService } from "../../jumpoints.service";

export interface JumpointInstallerDownloadDialogData {
    jumpointId: number;
    jumpointName: string;
    tenantId: number;
}

@Component({
    selector: "app-jumpoint-installer-download-overlay",
    templateUrl: "./jumpoint-installer-download-overlay.component.html",
    styleUrls: ["./jumpoint-installer-download-overlay.component.scss"],
})
export class JumpointInstallerDownloadOverlayComponent {
    isDownloading = false;
    downloadPercent = 0; // -1  → indeterminate
    progressMode: "determinate" | "indeterminate" = "determinate";

    constructor(
        public dialogRef: MatDialogRef<JumpointInstallerDownloadOverlayComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: JumpointInstallerDownloadDialogData,
        private readonly jumpointsService: JumpointsService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly errorDialog: ErrorDialogService
    ) {}

    public cancel(): void {
        if (!this.isDownloading) this.dialogRef.close();
    }

    public startDownload(): void {
        this.isDownloading = true;
        this.downloadPercent = 0;
        this.progressMode = "determinate";

        this.jumpointsService
            .downloadJumpointInstaller(this.data.tenantId, this.data.jumpointId)
            .subscribe({
                next: (ev: HttpEvent<Blob>) => {
                    switch (ev.type) {
                        case HttpEventType.DownloadProgress:
                            if (ev.total) {
                                this.downloadPercent = Math.round(
                                    (ev.loaded / ev.total) * 100
                                );
                            } else {
                                this.progressMode = "indeterminate";
                                this.downloadPercent = -1;
                            }
                            break;

                        case HttpEventType.Response:
                            const fileName = this.extractFileName(
                                ev.headers.get("content-disposition")
                            );
                            this.saveBlob(ev.body, fileName);
                            this.notificationDialog.show({
                                message: `Successfully downloaded Jumpoint Installer (${fileName}).`,
                            });
                            this.dialogRef.close(true);
                            break;
                    }
                },
                error: (err) => {
                    this.isDownloading = false;
                    this.progressMode = "determinate";
                    this.downloadPercent = 0;
                    this.errorDialog.show({
                        title: "Download Failed",
                        message:
                            "The download of the Jumpoint Installer failed. Please try a different platform type.",
                    });
                },
            });
    }

    private saveBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "jump-client-installer.bin";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    private extractFileName(cdHeader: string | null): string {
        const match = cdHeader?.match(
            /filename\\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i
        );

        return match ? decodeURIComponent(match[1] || match[2]) : "";
    }
}
