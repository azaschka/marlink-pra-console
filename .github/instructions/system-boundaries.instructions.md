---
description: "Use when changing frontend API integration, routing, or data models in PRA Console. Defines boundaries with PRA API and prohibits direct coupling to PRA Sync API/BeyondTrust."
name: "PRA System Boundaries"
applyTo:
  - "src/app/**/*.ts"
  - "src/app/**/*.html"
---

# PRA Console System Boundaries

- PRA Console is the UI layer and communicates with PRA API only.
- Do not call PRA Sync API directly from frontend code.
- Do not call BeyondTrust APIs directly from frontend code.
- Keep base URL, auth, and API-key injection centralized via interceptor/runtime config.

# Cross-Repo Contract Discipline

- If frontend service calls need new fields/filters/headers:
  - align first with PRA API contract,
  - avoid frontend-only protocol inventions.
- Keep route role checks and navigation role filtering aligned whenever permissions change.
- Prefer backward-compatible UI model changes; if breaking API changes are required, document dependency on PRA API updates.
