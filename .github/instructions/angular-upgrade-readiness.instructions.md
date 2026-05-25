---
description: "Use when changing Angular code that should remain upgrade-safe. Captures migration-safe rules toward newer Angular majors."
applyTo: "src/app/**/*.ts, src/app/**/*.html, src/app/**/*.scss, tsconfig*.json, package.json"
---
# PRA Console Angular Upgrade Readiness

- Scope and intent:
  - Keep new code compatible with incremental Angular major upgrades.
  - Avoid introducing patterns that increase migration cost.

- API and framework usage:
  - Avoid deprecated Angular APIs and legacy patterns in new code.
  - Keep feature modules and routing boundaries explicit and simple.
  - Prefer typed APIs where practical; reduce unbounded any usage in new code.

- Forms roadmap:
  - Prefer typed reactive forms for new implementations.
  - Do not expand untyped form usage unless required by legacy constraints.

- Standalone readiness:
  - Keep components and services decoupled from overly broad shared modules.
  - Avoid hidden dependencies that block future standalone migration.

- RxJS and zone compatibility:
  - Use explicit teardown patterns for subscriptions.
  - Keep stream side effects contained and predictable.
  - Avoid fragile async timing assumptions in components.

- TypeScript and config hygiene:
  - Keep tsconfig options modern and remove deprecated compiler options when feasible.
  - Introduce stricter typing in incremental, low-risk steps.

- Upgrade process discipline:
  - Upgrade one major at a time and validate after each step.
  - After each major bump, run typecheck, lint, build, and smoke tests before continuing.
