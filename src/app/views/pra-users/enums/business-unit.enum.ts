export enum BusinessUnit {
    MT = "MT",
    OA = "OA",
    DI = "DI",
    EG = "EG",
    TE = "TE",
}
export const BusinessUnitLabels: Record<BusinessUnit, string> = {
    [BusinessUnit.MT]: "Maritime",
    [BusinessUnit.OA]: "Omniacces",
    [BusinessUnit.DI]: "Diverto",
    [BusinessUnit.EG]: "EEG",
    [BusinessUnit.TE]: "Telemar",
};
