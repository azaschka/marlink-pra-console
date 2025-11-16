import { environment } from "environments/environment";

export const config = {
    praApiBaseUrl: environment.PRA_API_BASE_URL,
    praApiKey: environment.PRA_API_KEY,
    praAccessKey: environment.PRA_ACCESS_KEY,
    authRoles: {
        sa: ["Super Admin"],
        admin: ["Super Admin", "Admin"],
    },
};
