import { JumpointNodeBusinessUnit, JumpointNodeServiceType } from "../enums";

export interface JumpointDeploymentNode {
    id: number;
    certname: string;
    businessUnit: JumpointNodeBusinessUnit;
    siteKey: string;
    status: string;
    puppetServerDomain: string;
    customerName?: string | null;
    serviceType?: JumpointNodeServiceType;
    hasApproval?: boolean;
    isoFilePath?: string;
    creationDate: Date;
    lastModificationDate?: Date;
}
