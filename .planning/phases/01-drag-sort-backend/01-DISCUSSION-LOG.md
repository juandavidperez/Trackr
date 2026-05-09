# Phase 1: Drag-Sort Backend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-09
**Phase:** 01-drag-sort-backend
**Areas discussed:** Position numbering scheme, List endpoint default sort, Cross-column endpoint strategy

---

## Position Numbering Scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Dense integers | 1,2,3… reindexed on every move. Simple reads, multiple row updates per reorder. | |
| Gap-based integers | 0,1000,2000… Only moved task updated. Compaction when gap < 1. | ✓ |

**User's choice:** Gap-based integers, gap 1000, compact when gap < 1.
**Notes:** Selected for efficiency — reorder touches only the moved task in the common case.

---

## List Endpoint Default Sort

| Option | Description | Selected |
|--------|-------------|----------|
| Sort by position within status (default) | Frontend receives tasks already ordered. No explicit sort param needed. | ✓ |
| Keep caller-controlled via Pageable | Callers must pass sort=position,asc explicitly. | |

**User's choice:** Sort by position within status by default for `listByProject`. My Tasks (`/api/tasks/me`) keeps its existing sort unchanged.
**Notes:** My Tasks is cross-project/cross-column so position sort there is meaningless.

---

## Cross-Column Endpoint Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Update existing /status endpoint | Automatically sets position to end of target column on status change. | ✓ |
| New /position endpoint only | Old /status untouched; frontend must always use /position for drags. | |

**User's choice:** Update existing `/status` endpoint to auto-set position to end of target column.
**Notes:** Keeps behavior consistent — any caller that changes status also gets correct position.

---

## Claude's Discretion

- Concurrency strategy (last-write-wins)
- Gap-size sub-details (gap = 1000, compaction private method)
- Authorization checks (reuse existing `requireMember`)

## Deferred Ideas

None.
