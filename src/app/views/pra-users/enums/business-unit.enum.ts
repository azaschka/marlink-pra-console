export enum BusinessUnit {
    MT = "MT",
    OA = "OA",
    MC = "MC",
    EG = "EG",
    TE = "TE",
}
export const BusinessUnitLabels: Record<BusinessUnit, string> = {
    [BusinessUnit.MT]: "Maritime",
    [BusinessUnit.OA]: "Omniaccess",
    [BusinessUnit.MC]: "Marlink Cyber",
    [BusinessUnit.EG]: "EEG",
    [BusinessUnit.TE]: "Telemar",
};
