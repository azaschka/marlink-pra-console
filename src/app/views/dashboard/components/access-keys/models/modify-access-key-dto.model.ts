import { AccessKeyValue } from "./access-key.model";

export interface ModifyAccessKeyDto {
    key?: string;
    name?: string;
    value?: AccessKeyValue;
}
