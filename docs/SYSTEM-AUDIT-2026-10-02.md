# System audit — 2026-10-02

Reviewed the active React app, offline storage/service worker, Supabase RPCs/migrations, AI worker and existing tests. Existing checks passed: production build, ESLint and worker TypeScript. Added one audit characterization test; the backend suite passed 20/20 and the full suite passed 91/91 afterward. The new test confirms a defect; a passing characterization test does not mean the defect is fixed.

## Confirmed findings

### P1 — Retest activities can be impossible to complete

Migration 008 serves all 20 bank questions in the first attempt and excludes previously submitted questions. After a low score, `make_plan` still schedules quiz tasks. `lp_claim_quiz` returns ready because bank rows exist, but `lp_start_quiz` fails because none are unused. There is no additional-bank generation path. Reproduced with isolated PostgreSQL: publish a 20-item bank, answer all incorrectly, observe a pending quiz task, then attempt to start it and receive the exhausted-bank error. See the final audit test in `tests/backend.test.mjs`.

Recommended correction: avoid scheduling unavailable retests and clearly expose exhausted-bank state; implement additional grounded question generation if continued retests are required. Do not silently reuse submitted items as new evidence.

### P2 — Failed draft saves leave answers only in UI memory

`Quiz.select` updates local answers before calling `lp_save_draft`; a failure sets a global error but does not restore state or retain a durable retry queue. The exit control becomes available after failure. Leaving and reopening the quiz remounts it from server draft answers, losing the failed selection. Submission sends all current answers and may recover them if the user stays and submits successfully. This is a code-confirmed failure path; a live network-failure browser test was not run.

Recommended correction: distinguish unsaved answers, offer retry, and prevent accidental exit while unsaved changes remain or persist a suitable draft securely.

### P2 — Setup documentation omits required migration 008

README backend instructions stop at migration 007, but the current quiz worker produces easy/medium/hard metadata and the intended 20-question attempt behavior requires migration 008. Following README alone leaves hosted SQL on the older publisher/start function behavior. `docs/GROUNDED-QUIZ.md` mentions migration 008, but README's central setup instructions do not. This creates deployment drift; the actual hosted migration state was not inspected.

Recommended correction: align README setup order and release verification with migration 008.

## Runtime risk requiring hosted verification

Quiz generation runs synchronously inside the Edge Function request: planning, three generation batches and a review, with a possible second full generation attempt. Each provider call has its own 90-second deadline; there is no overall job deadline or durable quiz queue. Slow provider responses may exceed hosted request/runtime limits, and the UI loses its busy state on request failure while the server claim may remain until lease expiry. Hosted timeout behavior was not measured in this audit.

## What was verified and what remains unknown

- Isolated tests cover ownership/RLS, answer-key isolation, migrations, worker claims, grading, evidence, planning capacity, offline event replay, deletion/withdrawal, PDF extraction and mocked AI validation.
- Hosted Vercel page loaded its login screen without captured console warnings/errors. That browser origin had no authenticated session, so this run did not exercise hosted personal pages, AI calls or quiz submission.
- Earlier localhost browser smoke checks covered all six main pages and existing summary/results; they do not prove the current Vercel/Supabase deployment matches local code.
- Live provider output quality, deployed worker version, migration history, multi-user hosted concurrency, mobile PWA/offline/update/logout and accessibility/performance remain unverified.
- This audit adds evidence and a report; it does not fix the three new findings or deploy changes. Earlier quiz fixes remain in the working tree.
