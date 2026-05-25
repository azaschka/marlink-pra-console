# PRA Console Modernization Roadmap

This roadmap tracks the remaining work from the initial stabilization and modernization prompt.

## Current Snapshot

- Completed foundation work:
  - Security baseline started (docker/proxy/runtime key handling improved).
  - Quality gates introduced (typecheck, lint, build scripts).
  - Initial test baseline repaired and expanded (auth/interceptor tests added).
- Known follow-up:
  - Review env.js before commits to ensure no local keys are included.
  - Continue wave-by-wave to avoid broad regressions.

## Remaining Waves

### Wave 2: API and Error-Handling Consolidation

Goal: unify service patterns and error propagation without behavior regressions.

- Standardize service-level contextual error rethrow patterns.
- Remove HTML-formatted service error strings and shift formatting to UI layer.
- Align tenant-header and request option helpers across API services.
- Normalize cache invalidation behavior after mutations.
- Expand service tests for critical APIs.

Exit criteria:
- Typecheck, lint, and production build pass.
- Critical auth/API smoke paths pass.
- Updated tests cover key error paths.

### Wave 3: Angular Structure and Component Quality

Goal: reduce component complexity and improve maintainability.

- Split large components by responsibility (view-model extraction, helper services).
- Reduce expensive template method calls in data-heavy views.
- Tighten lifecycle and subscription patterns consistently.
- Introduce OnPush where safe and measurable.

Exit criteria:
- No functional regressions in affected views.
- Reduced complexity in targeted components.

### Wave 4: Testability Expansion

Goal: move from baseline tests to risk-focused coverage.

- Extract pure functions from complex workflows.
- Add service and guard tests for high-risk logic.
- Add regression tests for fixed bugs.
- Stabilize existing Karma/Jasmine suite before migration.

Exit criteria:
- Critical service/guard/interceptor paths covered.
- Reliable headless test runs in CI-like mode.

### Wave 5: Nx Decommission Readiness

Goal: evaluate and prepare a controlled path away from Nx if still desired.

- Map all current Nx targets to equivalent non-Nx commands.
- Define migration order for serve/build/test without big bang.
- Validate script compatibility and CI pipeline impact.
- Keep rollback path at every step.

Exit criteria:
- Clear migration proposal with risk register.
- No forced decommission before Angular upgrade preconditions are stable.

### Wave 6: Step-by-Step Angular Upgrade

Goal: upgrade incrementally to newer majors with safety checks.

- Perform one major at a time with validation after each step.
- Reconcile Angular, RxJS, TypeScript, and tooling compatibility.
- Resolve deprecations and strictness issues incrementally.
- Preserve application behavior after each major bump.

Suggested sequence:
1. Angular 14 to 15
2. Angular 15 to 16
3. Angular 16 to 17
4. Angular 17 to 18
5. Angular 18 to 19
6. Angular 19 to 20 (or latest stable)

Exit criteria:
- Each intermediate version builds and passes smoke tests.
- No unresolved blocker is carried forward blindly.

## Test Runner Strategy: Karma/Jasmine to Jest

Current state:
- Karma/Jasmine remains the active baseline.

Recommended migration timing:
- Migrate to Jest only after Wave 4 baseline is stable.
- Run migration in isolated changesets with equivalence checks.

Migration checklist:
- Introduce Jest tooling and config in parallel.
- Port and validate a pilot subset of tests.
- Compare pass/fail parity and runtime behavior.
- Migrate remaining suites in batches.
- Remove Karma only when Jest coverage is equivalent for critical paths.

## Working Agreement for Daily Sessions

For each session:
1. Pick one small changeset from the active wave.
2. Implement with minimal file scope.
3. Run typecheck, lint, build, plus targeted tests.
4. Record outcomes and remaining blockers in this roadmap.
5. Continue only when the previous step is stable.
