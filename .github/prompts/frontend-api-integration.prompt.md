---
description: "Implement or update a PRA Console frontend integration against PRA API with service, model, routing, i18n, and boundary-safe behavior."
name: "Frontend API Integration"
argument-hint: "Describe feature, API endpoint(s), request/response shape, role requirements, and UX behavior"
agent: "agent"
---

Implement the requested frontend API integration in this repository.

Input:
- {{input:Frontend Integration Request}}

Execution requirements:
- Keep architecture boundaries from [PRA System Boundaries](../instructions/system-boundaries.instructions.md).
- Follow service conventions and error handling patterns:
  - [api-service-patterns.instructions.md](../instructions/api-service-patterns.instructions.md)
  - [api-error-handling-patterns.instructions.md](../instructions/api-error-handling-patterns.instructions.md)
- Keep frontend structure and lifecycle conventions from [frontend-patterns.instructions.md](../instructions/frontend-patterns.instructions.md) and [rxjs-lifecycle-performance.instructions.md](../instructions/rxjs-lifecycle-performance.instructions.md).
- Do not call PRA Sync API or BeyondTrust APIs directly from frontend code.
- Use relative endpoints only; keep headers/base URL logic in interceptor/runtime config.
- If contract changes are needed, apply [Cross-Repo Contract Checklist](../CROSS_REPO_CONTRACT_CHECKLIST.md) and flag coupled repo follow-ups.
- Update routing/navigation/i18n when the feature requires it.
- Preserve existing feature semantics unless the request explicitly asks to change behavior. Do not introduce new UI meaning (for example, "empty field means keep current value") only because a backend field is optional.

Required output format:
1. Files changed and one-line purpose each.
2. API contract assumptions and impacted PRA API endpoints.
3. Boundary and security checks applied.
4. Tests and validation commands run.
5. Coupled-change notes for other repos (if applicable).
