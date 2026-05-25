const { HttpsProxyAgent } = require("https-proxy-agent");
const corporateProxy = process.env.CORPORATE_PROXY_URL || process.env.HTTPS_PROXY;
const agent = corporateProxy ? new HttpsProxyAgent(corporateProxy) : undefined;

module.exports = {
    "/api": {
        // Keep '/api' prefix and forward as-is to backend.
        target: "https://pra-console-dev.cdn-vas.net",
        secure: false,
        changeOrigin: true,
        logLevel: "debug",
        agent,
    },
};
