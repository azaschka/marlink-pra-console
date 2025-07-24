export interface ConsoleUserUpdateDto {
    id: number;
    username: string;
    password: string | undefined;
    displayName: string;
    role: string;
}
