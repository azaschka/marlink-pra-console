import { AccessKeyValue } from "./access-key.model";

export interface CreateAccessKeyDto {
    key: string;
    name: string;
    value: AccessKeyValue;
}
