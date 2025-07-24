export interface HxConfigUpdateDto {
    id: number;
    hxServerName: string;
    hxServerUrl: string;
    hxConfigJson: string;
    hxApiUrl: string;
    hxApiUser: string;
    hxApiPass: string;
    isDefault: boolean;
}
