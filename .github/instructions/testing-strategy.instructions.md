---
description: "Use when creating or modifying tests in this repo. Defines required test patterns for Angular services, interceptors, guards, and components."
applyTo: "src/**/*.spec.ts"
---
# PRA Console Testing Strategy Patterns

- Scope and strictness:
  - These rules apply to all test files under src.
  - Prefer deterministic unit tests over broad integration-style tests.

- Test naming and structure:
  - Use describe blocks by unit under test, for example JwtAuthService.
  - Use behavior-driven it names starting with a verb, for example stores token on successful login.
  - Follow Arrange-Act-Assert structure in each test.

- Service and HTTP tests:
  - Use HttpClientTestingModule and HttpTestingController for all HttpClient-based services.
  - Verify request method, URL, headers, and body for each HTTP call under test.
  - Always call httpMock.verify() in afterEach.
  - Assert both success and failure paths for auth and API services.

- Spies and test doubles:
  - Use jasmine.createSpyObj for Router, dialog services, and other collaborators.
  - Prefer lightweight fakes for local storage and state containers.
  - Keep spies narrow: mock only methods required by the test.

- Flake prevention:
  - Avoid time-dependent assertions unless explicitly controlled.
  - Avoid real network, browser navigation, and external link clicks.
  - For shallow component creation tests, use minimal templates or NO_ERRORS_SCHEMA where appropriate.

- Layer-specific minimal assertions:
  - Service tests:
    - Assert side effects on cache, storage, or state subjects when relevant.
    - Assert contextual error propagation for failure paths.
  - Interceptor tests:
    - Assert request transformation and error handling behavior.
  - Guard tests:
    - Assert both allow and deny behavior, including navigation side effects.
  - Component tests:
    - Assert key input/output behavior and critical UI state transitions.

- Coverage priorities:
  - Priority 1: auth service, interceptor, guards, critical API services.
  - Priority 2: data-heavy workflows and parser utilities.
  - Priority 3: presentational-only component tests.

- CI execution baseline:
  - Use npm test -- --watch=false --browsers=ChromeHeadless for CI-like runs.
