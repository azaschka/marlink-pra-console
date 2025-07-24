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
import { ConsoleUser, ConsoleUserAddDto } from "../../../../management/models";
import { ConsoleUserService } from "app/views/management/services/console-user.service";

interface ConsoleUserAddForm {
    username: FormControl<string>;
    password: FormControl<string>;
    displayName: FormControl<string>;
    role: FormControl<string>;
}

@Component({
    selector: "app-views-management-console-user-add-overlay",
    templateUrl: "./add-console-user-overlay.component.html",
    styleUrls: ["./add-console-user-overlay.component.scss"],
})
export class AddConsoleUserOverlayComponent implements OnInit {
    public consoleUserFormGroup: FormGroup<ConsoleUserAddForm>;
    public isLoading: boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: ConsoleUser,
        private readonly dialogRef: MatDialogRef<AddConsoleUserOverlayComponent>,
        private readonly errorService: AppErrorService,
        private readonly consoleUserService: ConsoleUserService
    ) {
        this.isLoading = false;
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
        this.addConsoleUserHandler(consoleUserDto);
    }

    public closeDialog(): void {
        this.dialogRef.close(false);
    }

    private buildItemForm(): void {
        this.consoleUserFormGroup = new FormGroup<ConsoleUserAddForm>({
            username: new FormControl("", Validators.required),
            password: new FormControl("", Validators.required),
            displayName: new FormControl("", Validators.required),
            role: new FormControl("Admin"),
        });
    }

    private mapFormValuesToDto(): ConsoleUserAddDto {
        return {
            username: this.consoleUserFormGroup.controls.username.value,
            password: this.consoleUserFormGroup.controls.password.value,
            displayName: this.consoleUserFormGroup.controls.displayName.value,
            role: this.consoleUserFormGroup.controls.role.value,
        };
    }

    private async addConsoleUserHandler(
        consoleUserDto: ConsoleUserAddDto
    ): Promise<void> {
        this.isLoading = true;
        this.consoleUserFormGroup.disable();

        await this.consoleUserService
            .createConsoleUser(consoleUserDto)
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
