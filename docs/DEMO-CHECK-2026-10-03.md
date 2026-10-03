# Demo readiness check — 2026-10-03

Targets: https://learn-pilot-blush.vercel.app/ and http://localhost:5174/

## Confirmed
- Both URLs render the LearnPilot login screen in the in-app browser.
- No browser warning/error console entries captured on the initial login screens.
- Hosted analyze-content OPTIONS preflight returns HTTP 200 and the exact Access-Control-Allow-Origin for both target origins. These checks do not call Gemini.
- Hosted frontend asset names match the current local production build: index-yGofTDJ9.js and LearningQuiz-C_B-4snI.js. Public bundles contain bank availability, navigation guard, review and strengths UI.
- npm test: 99 passed, 0 failed.
- npm run build, npm run lint, npm run typecheck:worker: passed.

## Pending / not certified
- Browser session is not authenticated on either target; user login is needed to continue.
- Live snapshot / migration 009 alignment, import, Gemini summary, quiz generation, submission, review UI interaction and plan repair have not been verified in this run.
- Successful CORS preflight does not verify authentication, provider quota or model availability.
- Physical mobile/PWA offline installation/update/logout/sync and hosted concurrency are not certified.

No live learning records were created or changed. No Gemini generation requests were made. No deployment or backend configuration changes were performed.

## Authenticated follow-up

- Vercel authenticated session loads 4 courses and the existing TCP lesson with summary, source view controls and five concepts.
- Updated the waiting service worker using the app update control.
- Invoked the existing lesson's quiz start action once; a 10-question draft opened successfully. This verifies the hosted quiz start path, not whether the bank was freshly generated or reused.
- Selected option B on question 1, waited for the saved confirmation, returned to the lesson and reopened the draft. The same selection and 1/10 answered count persisted. No quiz was submitted and no test score was added.
- Progress, planner and Tutor pages render. Account currently has zero submitted quizzes, so live results/review/strengths and post-submission planning could not be certified without submitting answers.
- No warning/error console logs captured during these checks.
- Localhost's user-facing tab remains unauthenticated.

Verdict: Vercel is usable for a partial demo of existing lessons and resumable quizzes. Complete presentation readiness still requires one actual quiz submission and verification of results, review and planning. Fresh import/summary generation, exhausted bank repair and physical-device PWA remain unverified.

## Mobile PDF compatibility fix

A mobile upload reported `undefined is not a function`. PDF.js 6's legacy build uses `for await` over ReadableStream during getTextContent. Removing native stream async iteration reproduced failure in all nine PDF extraction fixtures. Added a getReader-based fallback in pdf-compat.ts, shared by the frontend and PDF worker. The same simulated older-browser fixtures now pass, including Thai and multipage PDFs. Added cancellation/lock-release tests. npm test: 100 passed; production build passed. Physical iPhone reproduction with the user's original PDF and deployment of this fix remain pending. No Gemini call is needed to test file extraction itself.
