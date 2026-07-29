# Plan 01-02 Summary: Service Logic

Core position management logic implemented in `TaskService`.

## Key Changes
- **TaskService.create()**: Automatically assigns position as `max(column) + 1000`.
- **TaskService.updateStatus()**: Appends moved task to the end of the target column.
- **TaskService.updatePosition()**: New public method to update both status and position.
- **Compaction**: Implemented `compactIfNeeded` and `compactColumn` to re-index positions when gaps disappear (gap < 1).
- **TaskServiceTest**: All 5 position logic test stubs implemented and passed.

## Verification
- `TaskServiceTest` coverage expanded to include position assignment, cross-column move positioning, and compaction triggers.
- All new service methods are covered by tests.
