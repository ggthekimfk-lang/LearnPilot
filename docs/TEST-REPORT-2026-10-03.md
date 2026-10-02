# System test report — 2026-10-03

## Current checks

- `npm test`: PASS — 91 tests, 0 failures, 0 skipped.
- `npm run build`: PASS — frontend TypeScript and production Vite build.
- `npm run lint`: PASS.
- `npm run typecheck:worker`: PASS.
- Browser smoke check at `http://127.0.0.1:5173/`: authenticated session loaded; Today, Library, Plan, Progress, Account and Settings rendered. Existing courses and plan versions loaded. No warning/error console entries captured during these checks. The current account has no lesson or submitted quiz, so lesson/results browser checks were not possible.

Automated coverage includes isolated PostgreSQL business rules, migrations, ownership/RLS/grants, import and submit idempotency, answer-key isolation, grading/evidence, shared planning capacity, offline event conflicts, withdrawal/deletion, actual PDF.js extraction, and mocked AI generation/validation/retry paths. Database tests use PGlite; provider tests use mocks.

## Confirmed unresolved findings

1. **P1 — Impossible retest activities.** The final backend audit test reproduces this on the current code: publish 20 questions, answer all incorrectly, and a pending quiz activity is scheduled. The quiz claim reports ready, but starting the activity fails because all questions have been used. Migration 008 consumes the bank in the first attempt, while no additional-bank generation path exists. This test passes because it asserts the defect; its passing status does not mean the defect is fixed. Evidence: `tests/backend.test.mjs`, final audit test; `supabase/migrations/202610020008_grounded_quiz.sql`, `lp_start_quiz`.
2. **P2 — Unsaved quiz answers can be lost.** `src/leanpilot/LearningQuiz.tsx` changes local answers before `lp_save_draft` succeeds. `run` in `src/leanpilot/LeanPilot.tsx` catches the error and clears busy state. The back control then becomes enabled without an unsaved-answer guard or retry queue. Leaving and reopening restores server answers, losing the failed selection. Confirmed by code inspection; browser network-failure reproduction was not run because this account has no quiz. Submitting while remaining on the page can still save all current answers.
3. **P2 — Incomplete backend setup instructions.** README lists migrations 001 through 007 although current grounded quiz SQL requires migration 008. Following these instructions can leave worker and database behavior mismatched. The hosted migration history was not inspected.

Recommended order: prevent unavailable retest scheduling and expose bank exhaustion; add reliable unsaved-answer recovery/exit protection; update setup documentation through migration 008.

## Remaining verification

This is not a complete live end-to-end certification. Live import/AI calls and quiz submission, hosted multi-user concurrency, deployed worker/migration alignment, production PWA offline/update/logout/sync, physical mobile installation, accessibility and performance still need verification. Quiz generation performs multiple sequential provider calls without an overall durable job deadline; hosted timeout behavior remains a risk rather than a reproduced failure in this run.

No application fixes, deployment, live record mutations or account changes were performed. Existing working-tree edits were preserved.
