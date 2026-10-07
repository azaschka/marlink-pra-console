import { UserSourceType } from "./enums";
import { User } from "./models";
import { UsersComponent } from "./users.component";

/**
 * R3.2-A003/A004: the Users list shows the account type; the type decides the wording of the delete confirmation.
 * The two helpers are pure, so they are exercised without rendering the component.
 */
describe("UsersComponent user type helpers", () => {
    const component = Object.create(UsersComponent.prototype) as UsersComponent;
    const user = (sourceType?: UserSourceType) => ({ id: 1, publicDisplayName: "U", sourceType }) as User;

    it("labels local, external and unknown accounts", () => {
        expect(component.sourceTypeLabel(user(UserSourceType.Internal))).toBe("Local");
        expect(component.sourceTypeLabel(user(UserSourceType.External))).toBe("External");
        expect(component.sourceTypeLabel(user(undefined))).toBe("—");
    });

    it("recognises external accounts only by the reported source type", () => {
        expect(component.isExternalUser(user(UserSourceType.External))).toBeTrue();
        expect(component.isExternalUser(user(UserSourceType.Internal))).toBeFalse();
        expect(component.isExternalUser(user(undefined))).toBeFalse();
    });
});
