import { ParsedUserType } from "../../../shared/services/site-excel-parser.service";
import { ImportStatus, ImportStep } from "../models";
import { SiteImportWorkflowService } from "./site-import-workflow";

/** EXT-15: external users must never reach a PRA API that would treat them as local users. */
describe("SiteImportWorkflowService external user guard", () => {
    function createWorkflow(supported: boolean | undefined) {
        const customersService = jasmine.createSpyObj("CustomersService", ["createCustomer"]);
        const sitesService = jasmine.createSpyObj("SitesService", ["supportsUserSourceType", "createSite"]);
        sitesService.supportsUserSourceType.and.resolveTo(supported);
        customersService.createCustomer.and.rejectWith({ status: 500 });
        const none = {} as never;
        const workflow = new SiteImportWorkflowService(
            customersService,
            { invalidate: () => undefined } as never,
            sitesService,
            none,
            none,
            none,
            none,
            none,
        );
        return { workflow, customersService, sitesService };
    }

    const parsed = (userType: ParsedUserType) =>
        ({
            customer: { key: "10001", name: "TEST", businessUnit: "MT" },
            site: { key: "10001-1", name: "SITE" },
            siteAuditors: [],
            siteManagers: [{ email: "m@example.com", userType, rowNumber: 3 }],
            siteApprovers: [],
            supportTeams: [],
            users: [],
            jumpAssets: [],
        }) as never;

    function run(workflow: SiteImportWorkflowService, data: never): Promise<ImportStep[]> {
        const steps: ImportStep[] = [];
        return new Promise((resolve) => {
            workflow.startWorkflow(1, data, steps).subscribe({
                error: () => resolve(steps),
                complete: () => resolve(steps),
            });
        });
    }

    it("stops before any write when the API does not report user types", async () => {
        const { workflow, customersService } = createWorkflow(false);

        const steps = await run(workflow, parsed(ParsedUserType.External));

        expect(steps.length).toBe(1);
        expect(steps[0].status).toBe(ImportStatus.Error);
        expect(steps[0].result).toContain("does not support external users");
        expect(customersService.createCustomer).not.toHaveBeenCalled();
    });

    it("stops when support cannot be verified", async () => {
        const { workflow, customersService } = createWorkflow(undefined);

        const steps = await run(workflow, parsed(ParsedUserType.External));

        expect(steps[0].result).toContain("could not be verified");
        expect(customersService.createCustomer).not.toHaveBeenCalled();
    });

    it("does not check anything for a workbook with local users only", async () => {
        const { workflow, sitesService, customersService } = createWorkflow(false);

        await run(workflow, parsed(ParsedUserType.Local));

        expect(sitesService.supportsUserSourceType).not.toHaveBeenCalled();
        expect(customersService.createCustomer).toHaveBeenCalled();
    });
});
