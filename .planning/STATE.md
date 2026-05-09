# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-08)

**Core value:** Tasks can be prioritized visually and in real time — reordering sticks, deadlines are visible on a calendar, and collaborators see changes instantly.
**Current focus:** Phase 1 — Drag-Sort Backend

## Current Position

Phase: 1 of 5 (Drag-Sort Backend)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-08 — Roadmap created for Milestone 2

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Persist task position via `position: int` DB field (not in-memory sort)
- Cross-project calendar using My Tasks scope (reuses TaskService)
- Spring WebSocket + STOMP — not raw WS (native Spring support, works with JWT security)
- Notify only assigned/owned tasks (reduces noise)

### Pending Todos

None yet.

### Blockers/Concerns

- `cdkDropListSortingDisabled` currently active on all Kanban columns — must be removed in Phase 2 only after Phase 1 backend is ready
- Render (backend host) supports WebSocket — confirmed in PROJECT.md; verify at Phase 4 start
- Frontend on Netlify is static — WebSocket connects to Render backend directly (no proxy needed)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Notifications | Notification history / inbox page | v2 | Milestone 2 planning |
| Notifications | Notification preferences / mute per project | v2 | Milestone 2 planning |
| Calendar | Project-scoped calendar filter toggle | v2 | Milestone 2 planning |

## Session Continuity

Last session: 2026-05-09
Stopped at: Phase 1 context gathered via discuss-phase
Resume file: .planning/phases/01-drag-sort-backend/01-CONTEXT.md
