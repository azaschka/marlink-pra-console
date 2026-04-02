const { HttpsProxyAgent } = require("https-proxy-agent");
const corporateProxy =
    "http://azaschka:SDF897fg78ezFSDfsd54fsd54fds546sdf45@10.10.156.28:8080";
const agent = corporateProxy ? new HttpsProxyAgent(corporateProxy) : undefined;

module.exports = {
    "/api": {
        target: "https://pra-console-pp.cdn-vas.net/api",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
        /* Re-Write:  /api/auth/login  ->  /auth/login */
        pathRewrite: { "^/api": "" },
        agent,
    },
};
