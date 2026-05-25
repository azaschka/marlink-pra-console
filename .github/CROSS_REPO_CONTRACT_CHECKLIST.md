# Cross-Repo Contract Checklist

## Scope and Purpose

- Use this checklist when a change may affect contracts between PRA Console, PRA API, and PRA Sync API.
- Keep this file synchronized across all three repositories.

## Contract Surface

- Endpoint path, method, or version changed.
- Required/optional headers changed (for example tenant, access key, transaction id).
- Request DTO shape changed (added, removed, renamed, retyped fields).
- Response DTO shape changed (added, removed, renamed, retyped fields).
- Error status codes or error payload shape changed.
- Auth or authorization behavior changed (required role, key, token, scope).

## Coupled-Change Marking Policy

- Mark a change as coupled across at least two repositories when any item in Contract Surface changes.
- Mark a change as coupled when integration behavior changes in ways consumers must adapt to (retry semantics, timeout behavior, pagination/filter semantics).
- Mark a change as coupled when runtime configuration keys or environment contracts consumed by another repo change.
- In PR descriptions and commits, explicitly name impacted repos and expected follow-up actions.

## Required Coordination Notes

- State backward compatibility impact: compatible, partially compatible, or breaking.
- Document rollout order (which repository should be released first).
- List test evidence per impacted boundary (API tests, frontend integration checks, sync adapter checks).
- Add links to related PRs or tracking tasks in sibling repositories.

## Minimal Verification

- Validate updated contract in producer repo tests.
- Validate consumer adaptation in at least one impacted consumer repo.
- Confirm no direct boundary bypass is introduced (Console -> Sync API direct calls remain forbidden).
