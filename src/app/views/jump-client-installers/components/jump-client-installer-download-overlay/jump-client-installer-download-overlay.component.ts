import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import { FormControl, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ClipboardService } from "ngx-clipboard";
import { Subject, takeUntil } from "rxjs";
import { NotificationDialogService } from "../../../../shared/dialogs/notification-dialog/notification-dialog.service";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { AppService } from "../../../../app.service";
import { JumpClientInstallersService } from "../../jump-client-installers.service";
import { JumpClientInstallerPlatformType } from "../../enums";

export interface JumpClientInstallerKeyInfo {
    platformType: JumpClientInstallerPlatformType;
    filename: string;
}

export interface JumpClientInstallerDownloadDialogData {
    installerId: string;
    keyInfos: JumpClientInstallerKeyInfo[];
}

const MAP: Partial<Record<JumpClientInstallerPlatformType, string>> = {
    [JumpClientInstallerPlatformType.Linux32Armv7]: "linux-64",
    // [JumpClientInstallerPlatformType.Linux32Armv7Headless]: "linux-64-headless",
    [JumpClientInstallerPlatformType.Linux64X86]: "linux-64",
    // [JumpClientInstallerPlatformType.Linux64X86Headless]: "linux-64-headless",
    [JumpClientInstallerPlatformType.Linux64]: "linux-64",
    // [JumpClientInstallerPlatformType.Linux64Headless]: "linux-64-headless",
    // [JumpClientInstallerPlatformType.MacOsxX86]: "mac-dmg",
    // [JumpClientInstallerPlatformType.MacDmg]: "mac-dmg",
    // [JumpClientInstallerPlatformType.MacZip]: "mac-zip",
    [JumpClientInstallerPlatformType.WinNT64Msi]: "winNT-64-msi",
    [JumpClientInstallerPlatformType.Windows64Msi]: "winNT-64-msi",
    // [JumpClientInstallerPlatformType.Windows64]: "windows-64",
    [JumpClientInstallerPlatformType.WinNT32Msi]: "winNT-32-msi",
    [JumpClientInstallerPlatformType.Windows32Msi]: "winNT-32-msi",
    // [JumpClientInstallerPlatformType.Windows32]: "windows-32",
};

const DISPLAY_LABEL_MAP: Record<string, string> = {
    "linux-64": "Linux (x64)",
    "winNT-64-msi": "Windows (x64) MSI",
    "winNT-32-msi": "Windows (x86) MSI",
};

interface PlatformOption {
    value: JumpClientInstallerPlatformType;
    label: string;
}

@Component({
    selector: "app-jump-client-installer-download-overlay",
    templateUrl: "./jump-client-installer-download-overlay.component.html",
    styleUrls: ["./jump-client-installer-download-overlay.component.scss"],
})
export class JumpClientInstallerDownloadOverlayComponent
    implements OnInit, OnDestroy
{
    public platformCtrl =
        new FormControl<JumpClientInstallerPlatformType | null>(
            null,
            Validators.required
        );

    public isDownloading = false;
    public downloadPercent = 0; // -1  → indeterminate
    public progressMode: "determinate" | "indeterminate" = "determinate";
    public downloadUrl = "";

    public readonly platformOptions: PlatformOption[] = (() => {
        // Get all valid platform types
        const validPlatforms = Object.values(
            JumpClientInstallerPlatformType
        ).filter(
            (ui) => MAP[ui] !== undefined
        ) as JumpClientInstallerPlatformType[];

        // Group by mapped value to avoid duplicates
        const grouped = new Map<string, JumpClientInstallerPlatformType>();
        validPlatforms.forEach((platform) => {
            const mappedValue = MAP[platform];
            if (mappedValue && !grouped.has(mappedValue)) {
                grouped.set(mappedValue, platform);
            }
        });

        // Convert to PlatformOption array with display labels
        return Array.from(grouped.entries()).map(([mappedValue, platform]) => ({
            value: platform,
            label: DISPLAY_LABEL_MAP[mappedValue] || mappedValue,
        }));
    })();

    private destroy$ = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<JumpClientInstallerDownloadOverlayComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: JumpClientInstallerDownloadDialogData,
        private readonly jumpClientInstallersService: JumpClientInstallersService,
        private readonly notificationDialog: NotificationDialogService,
        private readonly clipboardService: ClipboardService,
        private readonly errorDialog: ErrorDialogService,
        private readonly appService: AppService
    ) {}

    public ngOnInit(): void {
        this.platformCtrl.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
                this.generateDownloadUrl();
            });

        this.generateDownloadUrl();
    }

    public ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public cancel(): void {
        if (!this.isDownloading) this.dialogRef.close();
    }

    public copyToClipboard(downloadUrl: string): void {
        this.clipboardService.copy(downloadUrl);
        this.notificationDialog.show({ message: "Copied to clipboard ..." });
    }

    private async generateDownloadUrl(): Promise<void> {
        if (!this.platformCtrl.value) {
            this.downloadUrl = "";
            return;
        }

        try {
            const baseUrl =
                await this.appService.fetchDefaultBeyondTrustInstanceApiBaseUrl();
            const mappedPlatform = MAP[this.platformCtrl.value];
            this.downloadUrl = `${baseUrl}/download_client_connector?jc=${this.data.installerId}&p=${mappedPlatform}`;
        } catch (error) {
            console.error("Failed to generate download URL:", error);
            this.downloadUrl = "";
        }
    }

    public startDownload(): void {
        const uiPlatform = this.platformCtrl.value;
        const btPlatform = uiPlatform ? MAP[uiPlatform] : undefined;
        if (!btPlatform) return;

        this.isDownloading = true;
        this.downloadPercent = 0;
        this.progressMode = "determinate";

        this.jumpClientInstallersService
            .downloadJumpClientInstallerPlatform(
                this.data.installerId,
                btPlatform
            )
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
                                message: `Successfully downloaded Jump Client Installer (${fileName}).`,
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
                            "The download of the Jump Client Installer failed. Please try a different platform type.",
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
