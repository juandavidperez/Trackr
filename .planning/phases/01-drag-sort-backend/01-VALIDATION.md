---
phase: 1
slug: drag-sort-backend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Mockito + Spring Boot Test |
| **Config file** | None — Spring Boot auto-configuration |
| **Quick run command** | `docker compose exec backend ./mvnw test -Dtest=TaskServiceTest,TaskControllerTest -q` |
| **Full suite command** | `docker compose exec backend ./mvnw test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `docker compose exec backend ./mvnw test -Dtest=TaskServiceTest,TaskControllerTest -q`
- **After every plan wave:** Run `docker compose exec backend ./mvnw test`
- **Before `/gsd-verify-work`:** Full suite must be green (all 118 + new tests)
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| position-field | 01 | 1 | DRAG-02 | — | N/A | unit | `./mvnw test -Dtest=TaskServiceTest` | ✅ extend | ⬜ pending |
| per-column-scope | 01 | 1 | DRAG-03 | — | N/A | unit | `./mvnw test -Dtest=TaskServiceTest` | ✅ extend | ⬜ pending |
| updateStatus-end-position | 01 | 1 | DRAG-04 | T-1-01 | Member check prevents non-member from calling | unit | `./mvnw test -Dtest=TaskServiceTest#updateStatus_setsPositionToEndOfTargetColumn` | ❌ Wave 0 | ⬜ pending |
| updateStatus-empty-column | 01 | 1 | DRAG-04 | — | N/A | unit | `./mvnw test -Dtest=TaskServiceTest#updateStatus_emptyColumn_setsPositionToZero` | ❌ Wave 0 | ⬜ pending |
| patch-position-200 | 01 | 2 | DRAG-05 | T-1-01 | requireMember() — non-member returns 403 | unit | `./mvnw test -Dtest=TaskControllerTest#updatePosition_validRequest_returns200` | ❌ Wave 0 | ⬜ pending |
| patch-position-null-pos | 01 | 2 | DRAG-05 | — | @NotNull validation | unit | `./mvnw test -Dtest=TaskControllerTest#updatePosition_nullPosition_returns400` | ❌ Wave 0 | ⬜ pending |
| patch-position-null-status | 01 | 2 | DRAG-05 | — | @NotNull validation | unit | `./mvnw test -Dtest=TaskControllerTest#updatePosition_nullStatus_returns400` | ❌ Wave 0 | ⬜ pending |
| compaction | 01 | 2 | DRAG-03 | — | N/A | unit | `./mvnw test -Dtest=TaskServiceTest#updatePosition_triggersCompaction_whenGapLessThanOne` | ❌ Wave 0 | ⬜ pending |
| create-assigns-position | 01 | 1 | DRAG-02 | — | N/A | unit | `./mvnw test -Dtest=TaskServiceTest#create_setsPositionToMaxPlusGap` | ❌ Wave 0 | ⬜ pending |
| task-response-position | 01 | 1 | DRAG-02 | — | N/A | unit | `./mvnw test -Dtest=TaskControllerTest` | ✅ update sampleResponse | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `TaskServiceTest` — add test methods: `updateStatus_setsPositionToEndOfTargetColumn`, `updateStatus_emptyColumn_setsPositionToZero`, `updatePosition_validRequest_updatesPositionAndStatus`, `updatePosition_triggersCompaction_whenGapLessThanOne`, `create_setsPositionToMaxPlusGap`
- [ ] `TaskControllerTest` — add test methods: `updatePosition_validRequest_returns200`, `updatePosition_nullPosition_returns400`, `updatePosition_nullStatus_returns400`
- [ ] Update `sampleResponse()` in `TaskControllerTest` to include `position` field in constructor call (positional — add as last arg)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DataSeeder assigns positions in dev profile | DRAG-02 | Seeder runs at startup only | Start containers, `docker compose exec db psql -U trackr -d trackr -c "SELECT id, status, position FROM tasks ORDER BY status, position;"` — verify 0,1000,2000... per status group |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
