export enum AppRoute {
    // Feature routes
    Dashboard = "/dashboard",
    Sites = "/sites",
    Customers = "/customers",
    Users = "/users",
    GroupPolicies = "/group-policies",
    Jumpoints = "/jumpoints",
    JumpGroups = "/jump-groups",
    JumpAssets = "/jump-assets",
    JumpClientInstallers = "/jump-client-installers",
    PraUsers = "/pra-users",
    BtDiscrepancies = "/bt-discrepancies",
    BtBackups = "/bt-backups",
    Logs = "/logs",

    // Session routes
    SignIn = "/sessions/signin",
    SignUp = "/sessions/signup",
    ForgotPassword = "/sessions/forgot-password",
    Lockscreen = "/sessions/lockscreen",
    NotFound = "/sessions/404",
}
