import { JumpClientInstallerPlatformType } from "../enums";

export interface JumpClientInstallerKeyInfo {
    platformType: JumpClientInstallerPlatformType;
    encodedInfo?: string;
    filename?: string;
    installerPath?: string;
}
