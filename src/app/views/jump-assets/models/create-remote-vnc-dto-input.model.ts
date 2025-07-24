import { JumpGroupType } from "../enums";

export interface CreateRemoteVncDtoInput {
    name: string;
    jumpointId: number;
    hostname: string;
    jumpGroupId: number;

    port?: number;
    jumpGroupType?: JumpGroupType;
    tag?: string;
    comments?: string;
    jumpPolicyId?: number | null;
    sessionPolicyId?: number | null;
}
