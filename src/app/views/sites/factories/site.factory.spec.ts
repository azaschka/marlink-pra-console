import { ParsedAccessLevel, ParsedTrustLevel, ParsedUserType } from "../../../shared/services/site-excel-parser.service";
import { SiteUserSourceType } from "../enums";
import { SiteFactory } from "./site.factory";

describe("SiteFactory source types (R3.2-A003)", () => {
    const site = { key: "10001-1", name: "Ext Test" };
    const team = { teamName: "TEAM A", accessLevel: ParsedAccessLevel.Full, trustLevel: ParsedTrustLevel.RequireAuth };

    it("sends internal for local users and external for external users", () => {
        const request = SiteFactory.create(
            site,
            "10001",
            [{ email: "aud@example.com", isAdminOperator: false, userType: ParsedUserType.External, rowNumber: 3 }],
            [
                { email: "loc@example.com", userType: ParsedUserType.Local, rowNumber: 3 },
                { email: "ext@example.com", userType: ParsedUserType.External, rowNumber: 4 },
            ],
            [],
            [team],
            [
                {
                    firstName: "A",
                    lastName: "B",
                    email: "member@example.com",
                    teamName: "TEAM A",
                    userType: ParsedUserType.External,
                    rowNumber: 2,
                },
            ],
        );

        expect(request.siteManagers).toEqual([
            { username: "loc@example.com", email: "loc@example.com", sourceType: SiteUserSourceType.Internal },
            { username: "ext@example.com", email: "ext@example.com", sourceType: SiteUserSourceType.External },
        ]);
        expect(request.siteAuditors?.[0].sourceType).toBe(SiteUserSourceType.External);
        expect(request.siteSupportTeamMembers?.[0].sourceType).toBe(SiteUserSourceType.External);
    });

    it("treats a missing type as internal (PRA Console 3.1 behaviour)", () => {
        const request = SiteFactory.create(
            site,
            "10001",
            [],
            [{ email: "loc@example.com" } as never],
            [],
            [team],
            [],
        );

        expect(request.siteManagers[0].sourceType).toBe(SiteUserSourceType.Internal);
    });
});
