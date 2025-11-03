export interface JumpAssetUpdateRequest {
    name: string;
    tag: string;
    jumpGroupId: number;
    jumpGroupType: "shared"; // always "shared" for now
    jumpPolicyId?: number | null;
    hostname?: string; // For remote rdp, shell jumps, remote vncs, protocol tunnels
    url?: string; // For web jumps
    port?: number; // For remote vncs or shell jumps
    mustVerifyCertificate?: boolean; // For web jumps
}
