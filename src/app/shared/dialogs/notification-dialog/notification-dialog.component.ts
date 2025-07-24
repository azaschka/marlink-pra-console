import { Component, Inject } from "@angular/core";
import {
    MAT_SNACK_BAR_DATA,
    MatSnackBarRef,
} from "@angular/material/snack-bar";
import { NotificationDialogData } from "./notification-dialog.service";

@Component({
    selector: "app-notification-snackbar",
    template: `
        <div class="notification-snackbar">
            <mat-icon *ngIf="data.icon" class="icon">{{ data.icon }}</mat-icon>
            <span class="message">{{ data.message }}</span>
            <button
                *ngIf="data.action"
                mat-button
                class="action-btn"
                (click)="actionButtonClickHandler()"
            >
                {{ data.action }}
            </button>
        </div>
    `,
    styles: [
        `
            .notification-snackbar {
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
            }
            .notification-snackbar .icon {
                font-size: 22px;
            }
            .notification-snackbar .message {
                flex: 1 1 auto;
                white-space: pre-line;
            }
            .notification-snackbar .action-btn {
                margin-left: 16px;
                font-weight: bold;
            }
        `,
    ],
})
export class NotificationDialogComponent {
    // Der Service setzt diese Property beim Öffnen!
    public actionButtonClickHandler: () => void = () => {};

    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: NotificationDialogData,
        public readonly snackbarRef: MatSnackBarRef<NotificationDialogComponent>
    ) {}
}
