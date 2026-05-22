import {
    JumpGroupType,
    RdpQualityMode,
    ShellJumpTerminalType,
    TunnelType,
    WebJumpUsernameFormatType,
} from "../../views/jump-assets/enums";

/** Valid port number range for all jump item types. */
export const BT_PORT_RANGE = {
    MIN: 1,
    MAX: 65535,
} as const;

/** Defaults applied to all Remote RDP jump items (not exposed in the UI). */
export const BtRemoteRdpDefaults = {
    jumpGroupType: JumpGroupType.Shared,
    qualityMode: RdpQualityMode.Video,
    mustStartNewConsoleSession: false,
    mustIgnoreUntrustedServerCert: false,
    isSessionForensicsEnabled: false,
    sessionPolicyId: null,
} as const;

/** Defaults applied to all Remote VNC jump items (not exposed in the UI). */
export const BtRemoteVncDefaults = {
    jumpGroupType: JumpGroupType.Shared,
    defaultPort: 5900,
    sessionPolicyId: null,
} as const;

/** Defaults applied to all Shell Jump items (not exposed in the UI). */
export const BtShellJumpDefaults = {
    jumpGroupType: JumpGroupType.Shared,
    defaultPortSsh: 22,
    defaultPortTelnet: 23,
    terminalType: ShellJumpTerminalType.Xterm,
    keepAliveIdleSessionInSeconds: 0,
    sessionPolicyId: null,
} as const;

/** Defaults applied to all Web Jump items (not exposed in the UI). */
export const BtWebJumpDefaults = {
    jumpGroupType: JumpGroupType.Shared,
    mustVerifyCertificate: false,
    usernameFormatType: WebJumpUsernameFormatType.Default,
    authenticationTimeoutInSeconds: 3,
    usernameField: "",
    passwordField: "",
    submitField: "",
    sessionPolicyId: null,
} as const;

/** Defaults applied to all Protocol Tunnel jump items (not exposed in the UI). */
export const BtProtocolTunnelDefaults = {
    jumpGroupType: JumpGroupType.Shared,
    tunnelType: TunnelType.Tcp,
    username: "",
    database: "",
    url: "",
    caCertificates: "",
    sessionPolicyId: null,
} as const;

/**
 * Jump group type string used for individual jump asset creation/update/copy
 * where the type is not user-selectable (always "shared").
 */
export const BT_JUMP_ITEM_GROUP_TYPE = JumpGroupType.Shared;
