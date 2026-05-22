/**
 * Defaults applied during BeyondTrust user creation (not exposed in the UI).
 */
export const BtUserDefaults = {
    /** New BT users must set up two-factor authentication. */
    isTwoFactorAuthRequired: true,
    /** New BT users are forced to change their password on first login. */
    mustResetPasswordOnNextLogin: true,
} as const;
