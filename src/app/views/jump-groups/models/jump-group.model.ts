export interface JumpGroup {
    id: number;
    name: string;
    codeName?: string;
    comments?: string | null;
    lastSyncDate: string; // ISO String
}
