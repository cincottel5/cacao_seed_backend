<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0 (new principle added)
- Modified principles: n/a (no existing principle redefined)
- Added principle: X. Code & Database Query Optimization
- Added sections: none (existing sections updated to reference 10 principles)
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ⚠ pending manual review (verify Constitution
    Check gates reference all 10 principles, including optimization)
  - .specify/templates/spec-template.md ⚠ pending manual review (no direct
    constitution references found; low risk)
  - .specify/templates/tasks-template.md ⚠ pending manual review (ensure task
    categorization reflects clean architecture layers and test-first workflow)
- Follow-up TODOs: none — all placeholders resolved with values supplied by the
  user or reasonable defaults for a new project.
-->

# Cacao Seed Project Backend Constitution
<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### I. Clean Architecture & Clean Code
The codebase MUST follow Clean Architecture layering (entities/domain, use
cases, interface adapters, frameworks/infrastructure) with dependencies
pointing inward only; outer layers MAY depend on inner layers, never the
reverse. Every unit of code MUST follow Clean Code practices: small
single-purpose functions, meaningful names, minimal side effects, and no
duplicated logic. Rationale: enforcing inward-only dependencies and clean code
keeps business logic independent of frameworks, databases, and delivery
mechanisms, making the system easier to change, test, and reason about over
time.

### II. REST API as the Core Structure
The REST API is the primary interface and integration surface of this project.
All external-facing functionality MUST be exposed through versioned,
resource-oriented REST endpoints using standard HTTP methods and status codes.
Endpoint contracts (request/response schemas, error formats) MUST be explicit
and documented before implementation. Rationale: establishing the REST API as
the core structure ensures a single, predictable integration point for clients
and avoids ad-hoc or inconsistent access patterns.

### III. Security by Design (NON-NEGOTIABLE)
Security MUST be considered for every change, not bolted on afterward. This
includes: input validation and output encoding at all trust boundaries,
authentication/authorization checks on every endpoint, least-privilege access
to data and infrastructure, secrets kept out of source control, and
dependencies checked for known vulnerabilities. Any change touching
authentication, authorization, data access, or external input MUST include an
explicit security review note in the PR/commit description. Rationale:
security defects are far more costly to fix after release; treating security
as a first-class, non-negotiable concern reduces risk across the entire system
lifecycle.

### IV. Simplicity Over Complicated Logic
Solutions MUST favor the simplest design that satisfies current, real
requirements (YAGNI). Speculative abstractions, premature optimization, and
unnecessary layers of indirection are prohibited unless justified by a
concrete, documented need. When two designs achieve the same outcome, the one
with fewer moving parts and less cognitive overhead MUST be chosen. Rationale:
simple systems are easier to secure, test, document, and maintain; complexity
must earn its way into the codebase.

### V. Reusable Code
Common logic MUST be extracted into shared, well-named modules/functions/
classes instead of being duplicated across the codebase. Reusable components
MUST have a clear, single responsibility and a stable interface before being
reused elsewhere. Copy-paste of non-trivial logic is prohibited; shared
behavior MUST be consolidated. Rationale: reusable code reduces maintenance
burden, shrinks the surface area for bugs, and keeps behavior consistent
across the application.

### VI. Avoid Code Smells & Document Design Patterns
Code MUST be regularly reviewed for common code smells (e.g., long methods,
god classes, feature envy, shotgun surgery, duplicated code) and refactored
when found. Where a design pattern (e.g., Repository, Factory, Strategy,
Adapter, Decorator) is used, it MUST be explicitly named and documented at its
point of use (e.g., in a docstring or adjacent comment) so future maintainers
understand the intent. Rationale: naming the pattern in use turns implicit
design decisions into explicit, shared knowledge, and actively hunting code
smells keeps technical debt visible and manageable.

### VII. Code Documentation
All public modules, classes, functions, and REST endpoints MUST include
documentation describing purpose, inputs, outputs, and error conditions.
Non-obvious business rules or trade-offs MUST be explained with a short
comment at the decision point; documentation MUST be updated in the same
change that alters the documented behavior. Rationale: accurate, current
documentation is required for a REST API consumed by other services/clients
and for long-term maintainability by contributors who were not present for the
original design decisions.

### VIII. Well-Separated Project Structure
The repository MUST maintain clear separation between application code,
tests, and documentation (e.g., dedicated `src`/application directories,
`tests` directories, and `docs` directories or equivalent per the chosen
stack). Application code MUST NOT be mixed with test code or documentation
artifacts in the same directory. Rationale: a predictable, separated structure
lowers the cost of navigation, onboarding, and tooling configuration (test
runners, linters, doc generators).

### IX. Testable Object-Oriented Code
Code MUST be designed for testability from the outset: dependencies MUST be
injected rather than hard-coded, side effects MUST be isolated behind
interfaces/abstractions, and classes MUST follow SOLID principles (in
particular Single Responsibility and Dependency Inversion). Every unit of
business logic MUST be covered by automated tests that can run without manual
setup. Rationale: testable, well-encapsulated object-oriented design is what
makes Clean Architecture and Test-First practices achievable in day-to-day
development.

### X. Code & Database Query Optimization
Code and database access MUST be written for efficient execution, not just
correctness. Hot paths and endpoints MUST avoid unnecessary computation,
N+1 query patterns, and unbounded result sets; database queries MUST use
appropriate indexes, pagination, and only fetch the fields/rows actually
needed. Any known performance trade-off MUST be documented at the point of
implementation, and changes with a measurable performance impact MUST include
before/after evidence (e.g., query plans, timings) in the PR/commit
description. Rationale: an inefficient REST API or data layer degrades user
experience and infrastructure cost as the system scales; treating performance
as a first-class concern alongside correctness prevents costly late-stage
rewrites.

## Quality & Security Standards

All changes MUST satisfy the following non-functional bars before merge:
security considerations documented per Principle III; no known critical/high
vulnerabilities introduced in dependencies; no newly introduced code smells
per Principle VI left unaddressed; public API surface and non-obvious logic
documented per Principle VII; new/changed behavior covered by automated tests
per Principle IX; and code paths and database queries reviewed for
efficiency per Principle X. These standards apply uniformly regardless of the
specific language, framework, or infrastructure chosen for implementation.

## Development Workflow & Quality Gates

Every change MUST go through: (1) a design check confirming it respects Clean
Architecture layering and REST API contracts, (2) a security check confirming
Principle III has been addressed, (3) a simplicity check confirming no
unjustified complexity was introduced, and (4) a test check confirming
automated tests exist and pass. Code reviews MUST verify compliance with all
ten Core Principles before approval. Any deviation MUST be explicitly
justified in the PR/commit description and, if it represents a recurring
pattern, MUST trigger a constitution amendment proposal.

## Governance

This constitution supersedes any conflicting practice, style guide, or ad-hoc
convention used elsewhere in the project. Amendments MUST be proposed via a
documented change to this file, MUST state the rationale and version bump
(MAJOR for backward-incompatible governance/principle removals or
redefinitions, MINOR for new principles or materially expanded guidance, PATCH
for clarifications and wording fixes), and MUST be reviewed before merge.
Compliance with this constitution MUST be verified during every code review;
reviewers MUST reject changes that violate a Core Principle without an
explicit, documented justification. Complexity that violates Principle IV
(Simplicity) MUST be justified in writing or removed.

**Version**: 1.1.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
