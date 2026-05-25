const runtimeEnv = (window as any)["env"] ?? {};

export const environment = {
    production: false,
    PRA_API_BASE_URL: runtimeEnv["PRA_API_BASE_URL"] || "/api",
    PRA_API_KEY: runtimeEnv["PRA_API_KEY"] || "",
    PRA_ACCESS_KEY: runtimeEnv["PRA_ACCESS_KEY"] || "",
};
