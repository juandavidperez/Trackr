# Plan 02-01 Summary: Frontend Reorder Logic

Phase 2 deliverables are complete. The Kanban board now supports persistent intra-column reordering.

## Key Changes
- **Task Model**: Updated `TaskResponse` with `position` field and added `TaskPositionRequest` interface.
- **Task Service**: Added `updatePosition` method calling `PATCH /api/tasks/{id}/position`.
- **Project Detail Component**:
    - Removed `cdkDropListSortingDisabled` from all columns.
    - Enhanced `onTaskDrop` with gap-based position calculation (midpoint of neighbors).
    - Implemented optimistic updates with automatic sorting.
    - Added `currentlyUpdatingTaskIds` signal to show disabled state during API calls.
    - Added error recovery that reverts UI to pre-drop state on failure.
- **Unit Tests**: Bootstrapped `project-detail.component.spec.ts` with 6 comprehensive test cases covering reorder math, cross-column moves, optimistic updates, and error revert.

## Verification
- Total frontend tests: 101 PASSED.
- Spec-specific tests: 6 PASSED.
- Verified gap math: (posBefore + posAfter) / 2 correctly handles start, middle, and end insertions.
