import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormControl } from "@angular/forms";
import { Observable, of, map, startWith } from "rxjs";
import { ErrorDialogService } from "../../../../shared/dialogs/error-dialog/error-dialog.service";
import { UsersService } from "../../../users/users.service";
import { GroupPoliciesService } from "../../group-policies.service";
import { User } from "../../../users/models";
import { GroupPolicy } from "../../models";
import { GroupPolicyMember } from "../../models/group-policy-member.model";

export interface GroupPolicyOverlayDialogData {
    groupPolicy: GroupPolicy;
}

@Component({
    selector: "app-group-policy-overlay",
    templateUrl: "./group-policy-overlay.component.html",
})
export class GroupPolicyOverlayComponent implements OnInit {
    public isLoading = false;

    public allUsers: User[] = [];
    public groupPolicyMembers: GroupPolicyMember[] = [];
    public filteredUsers$: Observable<User[]> = of([]);

    public userInputCtrl = new FormControl<string>("");
    public userFormGroup = new FormGroup({
        userInput: this.userInputCtrl,
    });

    public readonly groupPolicy: GroupPolicy;

    constructor(
        public dialogRef: MatDialogRef<GroupPolicyOverlayComponent>,
        @Inject(MAT_DIALOG_DATA) public data: GroupPolicyOverlayDialogData,
        private readonly usersService: UsersService,
        private readonly groupPoliciesService: GroupPoliciesService,
        private readonly errorDialog: ErrorDialogService
    ) {
        this.groupPolicy = data.groupPolicy;
    }

    public async ngOnInit(): Promise<void> {
        await this.loadOverlayData();
    }

    public close(): void {
        this.dialogRef.close(false);
    }

    public async addUserToPolicy(user: User): Promise<void> {
        this.isLoading = true;
        this.userFormGroup.disable();
        try {
            await this.groupPoliciesService.addMemberToGroupPolicy(
                this.groupPolicy.id,
                {
                    userId: user.id,
                    securityProviderId: user.securityProviderId!,
                    distinguishedName: user["distinguishedName"], // Optional, je nach user
                    groupName: undefined,
                }
            );
            this.groupPolicyMembers =
                await this.groupPoliciesService.fetchGroupPolicyMembers(
                    this.groupPolicy.id
                );
        } catch (err) {
            this.errorDialog.show({
                title: "Error",
                message: "Could not add user to group policy.",
            });
        } finally {
            this.isLoading = false;
            this.userFormGroup.enable();
            this.userInputCtrl.setValue("");
        }
    }

    public async removeUserFromPolicy(
        member: GroupPolicyMember
    ): Promise<void> {
        this.isLoading = true;
        this.userFormGroup.disable();
        try {
            await this.groupPoliciesService.removeMemberFromGroupPolicy(
                this.groupPolicy.id,
                member.memberId
            );
            this.groupPolicyMembers =
                await this.groupPoliciesService.fetchGroupPolicyMembers(
                    this.groupPolicy.id
                );
        } catch (err: any) {
            this.errorDialog.show({
                title: "Error",
                message:
                    err?.message ?? "Could not remove user from group policy.",
            });
        } finally {
            this.isLoading = false;
            this.userFormGroup.enable();
        }
    }

    private async loadOverlayData(): Promise<void> {
        this.isLoading = true;
        this.userFormGroup.disable();

        try {
            // Lade alle User für die autocomplete-Suche
            this.allUsers = await this.usersService.fetchUsers();

            // Lade alle Mitglieder der aktuellen Group Policy
            this.groupPolicyMembers =
                await this.groupPoliciesService.fetchGroupPolicyMembers(
                    this.groupPolicy.id
                );

            // Filter für autocomplete
            this.filteredUsers$ = this.userInputCtrl.valueChanges.pipe(
                startWith(""),
                map((value) => this.filterUsers(value || ""))
            );
        } catch (err) {
            this.errorDialog.show({
                title: "Error",
                message: "Could not load users or group policy members.",
            });
        } finally {
            this.isLoading = false;
            this.userFormGroup.enable();
        }
    }

    private filterUsers(value: string | User): User[] {
        let filterValue: string = "";
        if (typeof value === "string") {
            filterValue = value.toLowerCase();
        } else if (
            value &&
            typeof value === "object" &&
            "publicDisplayName" in value
        ) {
            filterValue = value.publicDisplayName?.toLowerCase() || "";
        }
        const memberUserIds = this.groupPolicyMembers.map((m) => m.userId);

        return this.allUsers.filter(
            (user) =>
                !memberUserIds.includes(user.id) &&
                (user.publicDisplayName?.toLowerCase().includes(filterValue) ||
                    user.username?.toLowerCase().includes(filterValue) ||
                    user.email?.toLowerCase().includes(filterValue))
        );
    }
}
