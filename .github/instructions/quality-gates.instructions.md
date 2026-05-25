---
description: "Use when implementing any change in this repo. Defines mandatory local and CI quality gates per changeset."
applyTo: "src/**/*.ts, src/**/*.html, src/**/*.scss, package.json, project.json"
---
# PRA Console Quality Gates

- Scope and strictness:
  - These checks are mandatory for every functional changeset.
  - Keep changesets small and reviewable.

- Required local checks per changeset:
  1. npm run typecheck
  2. npm run lint
  3. npm run build:console
  4. Targeted tests for changed behavior
  5. Manual smoke checks for impacted feature paths

- Test expectations:
  - For auth, interceptor, service, or guard changes, run npm test -- --watch=false --browsers=ChromeHeadless.
  - Add or update unit tests for bugfixes in critical paths.

- Smoke checklist baseline:
  - Sign in, sign out, and role-based route access.
  - Tenant/instance selection behavior for affected views.
  - CRUD path touched by the changeset.
  - Error dialogs or notifications for affected failure paths.

- CI parity:
  - Keep local commands aligned with CI to reduce integration surprises.
  - Do not merge changes that fail typecheck or production build.

- Change safety:
  - Do not perform large, unrelated refactors in the same changeset as bugfixes.
  - Document intentional behavior changes in PR description or commit message.
