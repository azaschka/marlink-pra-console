import { BusinessUnit } from "app/views/pra-users/enums";

export interface AccessKeyValue {
    businessUnits: BusinessUnit[];
}

export interface AccessKey {
    id: number;
    key: string;
    name: string;
    value: AccessKeyValue;
    creationDate: Date;
    lastModificationDate?: Date;
}
