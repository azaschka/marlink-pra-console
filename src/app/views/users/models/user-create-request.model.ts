export interface UserCreateRequest {
    publicDisplayName: string;
    username: string;
    passwordExpirationDate?: string | null;
    email?: string;
    preferredEmailLanguage?: string;
    isTwoFactorAuthRequired?: boolean;
    isLoginAllowed?: boolean;
    failedLoginAttempts?: number;
    mustResetPasswordOnNextLogin?: boolean;
}
