---
description: "Use when touching credentials, runtime config, proxy settings, docker publish flow, or local environment handling."
applyTo: "package.json, proxy.dev.conf.js, scripts/**/*.sh, src/environments/*.ts, src/assets/scripts/*.js, .zshrc"
---
# PRA Console Security, Secrets, and Runtime Config

- Hard rule:
  - Never commit secrets, passwords, API keys, tokens, or proxy credentials.

- Runtime env handling:
  - App runtime credentials must flow through window env variables.
  - Local runtime file generation is allowed, but generated sensitive values must not be committed.

- Local developer variables:
  - Use shell environment variables for local automation.
  - Prefer macOS Keychain-backed variable loading over plaintext shell exports.

- Docker publish flow:
  - Use password-stdin login flows.
  - Keep DOCKER_MARLINK_USER and DOCKER_MARLINK_PASSWORD out of committed source.

- Proxy config:
  - Use CORPORATE_PROXY_URL or HTTPS_PROXY variables.
  - Do not hardcode proxy usernames/passwords in proxy.dev.conf.js.

- API keys:
  - Use PRA_DEV_API_KEY and PRA_DEV_ACCESS_KEY for local generation workflows.
  - Validate required local keys before generating runtime env files.

- Review and incident hygiene:
  - If a secret is accidentally committed, rotate it immediately and remove from history if required by policy.
  - Mention security-impacting changes explicitly in review notes.
