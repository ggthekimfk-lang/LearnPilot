# Test report — 2026-10-02

## Local automated checks

- `npm test`: PASS, 83 tests, 0 failures, 0 skipped.
- `npm run build`: PASS (frontend TypeScript and production Vite build).
- `npm run lint`: PASS.
- `npm run typecheck:worker`: PASS.

Coverage includes isolated PostgreSQL migrations, ownership/RLS/grants, import limits and idempotency, worker leases and atomic publication, private quiz keys, grading, evidence, shared plan capacity, task preservation, offline completion replay, missed activities, withdrawal and deletion, Gemini mock responses/errors/retries, grounded question validation, Thai/English source references, and actual PDF.js fixture extraction. Provider tests use mocks; database tests use PGlite.

## Browser smoke checks

Started Vite at http://127.0.0.1:5173/ and used the existing authenticated session. All six main pages loaded: Today, Plan, Library, Progress, Account, Settings. Existing lesson summary and existing ten-question quiz results opened successfully. No browser console warnings/errors were captured during these checks. Existing backend data loaded successfully; repository deployment notes should not be treated as proof of the current hosted deployment state.

## Remaining verification

This run does not certify every function end to end. New live imports/AI generation, quiz submission, account mutations, destructive actions, hosted multi-user/concurrency checks, production service-worker offline/update/logout/sync, mobile installation, accessibility and performance were not exercised in the live account. Mutating business rules were exercised in the isolated automated tests instead. A dedicated test account/environment is needed for a complete live mutation matrix without affecting existing learning records.

No application source changes were needed for the checks above.

## Follow-up: quiz evidence rejection

Reproduced the reported Thai quality-check error with a PDF source whose first and second pages share a 2000-character chunk. Batch validation canonicalized the reference to page 2; final validation interpreted that canonical page against the original chunk's page 1 metadata and rejected genuine source evidence. `generateQuiz` now retains server-derived passage references until final validation, while still checking every batch and running the independent semantic review.

Added an end-to-end mock-provider regression test: it failed with the exact reported error before the fix and passes afterward, with verified page-2 references and exact source offsets. All 84 tests, build, lint and worker typecheck pass after the change.

The fix is local. The hosted site calls the Supabase `analyze-content` Edge Function, so updating Vercel frontend alone does not apply it. Redeploy that function to the linked Supabase project using an authenticated Supabase CLI; no new database migration is required for this patch. This run did not deploy or confirm the fix against the user's hosted document.

## Follow-up: Invalid or duplicate question

The previous validator grouped unknown concept IDs, duplicate prompts/options, malformed choices, invalid answer indexes and missing explanations under one generic error. The exact hosted cause cannot be determined from that message alone. Validation now returns a question number and specific Thai reason to both the user and the bounded AI repair prompt. Batch schemas constrain concept IDs to supplied concepts and correct indexes to 0–3. Malformed choices are checked before string operations to avoid incidental TypeErrors.

Six mock-provider tests verify invalid output produces specific repair feedback and corrected output completes all existing quiz checks. Persistent invalid/duplicate output remains rejected. All 90 tests, build, lint and worker typecheck pass. These changes remain local and require redeployment of the Supabase Edge Function before hosted verification.
