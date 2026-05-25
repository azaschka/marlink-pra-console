---
description: "Use when modifying reactive logic, subscriptions, or templates with computed expressions. Defines RxJS lifecycle and performance rules."
applyTo: "src/app/**/*.ts, src/app/**/*.html"
---
# PRA Console RxJS Lifecycle and Performance

- Lifecycle teardown:
  - Every manual subscription must have a teardown path.
  - Use subscriptionsToClear in base-component patterns or takeUntil with OnDestroy.
  - Do not leave ad-hoc subscriptions in components without cleanup.

- Stream composition:
  - Prefer composing streams over nested subscriptions.
  - Choose mapping operators intentionally:
    - switchMap for latest-only request flows.
    - concatMap for ordered writes.
    - exhaustMap for ignore-while-running actions.
    - mergeMap only when concurrency is explicitly desired.

- Error handling in streams:
  - Keep error handling close to domain boundaries.
  - Do not hide failures with silent fallback values unless behavior is explicitly intentional and documented.

- shareReplay guidance:
  - Use shareReplay only when a stream is intentionally shared.
  - Define reset and invalidation strategy for shared streams.

- Template performance:
  - Avoid expensive method calls directly in repeated template bindings.
  - Precompute derived view-model fields in component code.
  - Use trackBy in repeated lists where identity stability matters.

- Side-effect boundaries:
  - Keep side effects in explicit command handlers, not in query streams.
  - Keep service streams transport-focused and component streams UI-focused.

- Loading and finalization:
  - Ensure loading flags are reset on success and error paths.
  - Use finalize where appropriate in observable-based flows.
