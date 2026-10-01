/**
 * Source type of a site user as understood by the PRA API (`UserSourceType`): a local BeyondTrust account
 * ("internal") or one provisioned by an external identity provider ("external"). R3.2-A003.
 */
export enum SiteUserSourceType {
    Internal = "internal",
    External = "external",
}
