export interface JumpAssetCopyRequest {
    jumpGroupId: number;
    jumpGroupType: "shared"; // always "shared" for now
    name: string;
}
