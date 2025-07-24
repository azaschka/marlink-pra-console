export interface UserUpdateRequest {
    publicDisplayName?: string;
    username?: string;
    password?: string;
    passwordExpirationDate?: string | null;
    email?: string;
    preferredEmailLanguage?: string;
    isTwoFactorAuthRequired?: boolean;
    isLoginAllowed?: boolean;
    failedLoginAttempts?: number;
    mustResetPasswordOnNextLogin?: boolean;
}
