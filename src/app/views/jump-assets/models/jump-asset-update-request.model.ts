export interface JumpAssetUpdateRequest {
    jumpGroupId: number;
    jumpGroupType: "shared"; // always "shared" for now
    jumpPolicyId?: number | null;
}
