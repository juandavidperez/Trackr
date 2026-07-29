# Plan 01-01 Summary: Foundation

Structural foundation for task positioning implemented.

## Key Changes
- **Task Entity**: Added `position` Integer field.
- **TaskResponse DTO**: Added `position` field and updated constructor mapping.
- **TaskPositionRequest DTO**: Created for handling reorder requests.
- **TaskRepository**: Added `findMaxPositionInColumn` and `findByProjectAndStatusOrderByPosition` JPQL queries.
- **TaskService**: Updated `listByProject` to use position-based sorting.
- **Test Stubs**: Added 8 failing test stubs (5 in `TaskServiceTest`, 3 in `TaskControllerTest`) to drive implementation in Wave 2 and 3.

## Verification
- Code structure verified.
- Compilation attempted (skipped due to environment limitations, but syntax checked).
- Test stubs will be resolved in subsequent plans.
