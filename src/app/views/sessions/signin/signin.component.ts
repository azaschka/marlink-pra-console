import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import {
    Validators,
    UntypedFormGroup,
    UntypedFormControl,
} from "@angular/forms";
import { Subject } from "rxjs";
import { JwtAuthService } from "../../../shared/services/auth/jwt-auth.service";
import { AuthRole } from "app/shared/enums";

@Component({
    selector: "app-signin",
    templateUrl: "./signin.component.html",
    styleUrls: ["./signin.component.scss"],
})
export class SigninComponent implements OnInit, OnDestroy {
    @ViewChild("submitButton") submitButton: HTMLButtonElement;

    public signinForm: UntypedFormGroup;
    public isLoading: boolean;
    public errorMsg: string = "";
    public currentYear: number = new Date().getFullYear();

    private _unsubscribeAll: Subject<any>;

    constructor(
        private readonly jwtAuthService: JwtAuthService,
        private readonly router: Router
    ) {
        this.isLoading = true;
        this._unsubscribeAll = new Subject();
    }

    public ngOnInit(): void {
        this.signinForm = new UntypedFormGroup({
            username: new UntypedFormControl("", Validators.required),
            password: new UntypedFormControl("", Validators.required),
            rememberMe: new UntypedFormControl(true),
        });

        setTimeout(() => {
            this.isLoading = false;
        }, 500);
    }

    public ngOnDestroy(): void {
        this._unsubscribeAll.next(1);
        this._unsubscribeAll.complete();
    }

    public async signin(): Promise<void> {
        this.isLoading = true;
        const signinData = this.signinForm.value;

        this.submitButton.disabled = true;

        await this.jwtAuthService
            .login(signinData.username, signinData.password)
            .catch((reason) => {
                this.isLoading = false;
                this.submitButton.disabled = false;
                this.errorMsg = reason.message;
            })
            .finally(() => {
                this.redirectUserBasedOnRole();
            });
    }

    private redirectUserBasedOnRole(): void {
        const user = this.jwtAuthService.getPraUser();

        if (user && user.role === AuthRole.DATA_CENTER_ENGINEER) {
            this.router.navigateByUrl("/backups");
        } else if (
            user &&
            user.role !== AuthRole.SUPER_ADMIN &&
            this.jwtAuthService.return.indexOf("management") > -1
        ) {
            this.router.navigateByUrl("/subscriptions");
        } else {
            this.router.navigateByUrl(this.jwtAuthService.return);
        }
    }
}
