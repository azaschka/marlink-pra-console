export interface Agent {
    id: number;
    siteId: string;
    siteName: string;
    licenseNumber: string;
    licenseActivated: boolean;
    agentId: string;
    pcHostname: string;
    pcGuid: string;
    pcMacAddress: string;
    installerVersion: string;
    installerType: string;
    setupVersion: string;
    ip: string;
    status: string;
    configWarn: boolean;
    needsConfigUpdate: boolean;
    isDuplicate: boolean;
    lastCheckIn: Date;
    registrationDate: Date;
}
