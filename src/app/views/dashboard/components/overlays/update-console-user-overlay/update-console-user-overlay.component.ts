import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
    Validators,
    FormGroup,
    FormControl,
    AbstractControl,
} from "@angular/forms";

// Services
import { AppErrorService } from "../../../../../shared/services/app-error/app-error.service";

// Models
import {
    ConsoleUserUpdateDto,
    ConsoleUser,
} from "../../../../management/models";
import { ConsoleUserService } from "app/views/management/services/console-user.service";

interface ConsoleUserUpdateForm {
    id: FormControl<number>;
    username: FormControl<string>;
    password: FormControl<string>;
    displayName: FormControl<string>;
    role: FormControl<string>;
}

@Component({
    selector: "app-views-management-console-user-update-overlay",
    templateUrl: "./update-console-user-overlay.component.html",
    styleUrls: ["./update-console-user-overlay.component.scss"],
})
export class UpdateConsoleUserOverlayComponent implements OnInit {
    public consoleUserFormGroup: FormGroup<ConsoleUserUpdateForm>;
    public isLoading: boolean;

    private consoleUserBefore: ConsoleUser;

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: ConsoleUser,
        private readonly dialogRef: MatDialogRef<UpdateConsoleUserOverlayComponent>,
        private readonly errorService: AppErrorService,
        private readonly consoleUserService: ConsoleUserService
    ) {
        this.isLoading = false;
        this.consoleUserBefore = this.data;
    }

    public get username(): AbstractControl<string, string> {
        return this.consoleUserFormGroup.get("username");
    }
    public get password(): AbstractControl<string, string> {
        return this.consoleUserFormGroup.get("password");
    }
    public get displayName(): AbstractControl<string, string> {
        return this.consoleUserFormGroup.get("displayName");
    }
    public get role(): AbstractControl<string, string> {
        return this.consoleUserFormGroup.get("role");
    }

    public async ngOnInit(): Promise<void> {
        this.buildItemForm();
    }

    public submitConsoleUserHandler(): void {
        const consoleUserDto = this.mapFormValuesToDto();
        this.updateConsoleUserHandler(consoleUserDto);
    }

    public closeDialog(): void {
        this.dialogRef.close(false);
    }

    private buildItemForm(): void {
        const c = this.consoleUserBefore;

        this.consoleUserFormGroup = new FormGroup<ConsoleUserUpdateForm>({
            id: new FormControl(c.id),
            username: new FormControl(c.username, Validators.required),
            password: new FormControl(""),
            displayName: new FormControl(c.displayName, Validators.required),
            role: new FormControl(c.role),
        });
    }

    private mapFormValuesToDto(): ConsoleUserUpdateDto {
        return {
            id: this.consoleUserFormGroup.controls.id.value,
            username: this.consoleUserFormGroup.controls.username.value,
            password: this.consoleUserFormGroup.controls.password.value,
            displayName: this.consoleUserFormGroup.controls.displayName.value,
            role: this.consoleUserFormGroup.controls.role.value,
        };
    }

    private async updateConsoleUserHandler(
        consoleUserDto: ConsoleUserUpdateDto
    ): Promise<void> {
        this.isLoading = true;
        this.consoleUserFormGroup.disable();

        await this.consoleUserService
            .updateConsoleUser(consoleUserDto)
            .then((response) => {
                if (response.statusCode > 201) {
                    return this.showErrorModal(
                        response.statusCode,
                        response.message
                    );
                }
            })
            .catch((reason) => {
                this.showErrorModal(
                    reason.error.statusCode,
                    reason.error.message
                );
            });

        this.isLoading = false;
        this.dialogRef.close(true);
    }

    private showErrorModal(title: string | number, message: string): void {
        this.errorService.show({
            title: `Error - ${title.toString()}`,
            message: message,
        });
        this.consoleUserFormGroup.enable();
    }
}
