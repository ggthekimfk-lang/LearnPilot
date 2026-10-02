# Grounded quiz generation

Quiz requests now use `supabase/functions/analyze-content/quiz.ts`: analyze original uploaded source and plan coverage, generate separate batches of 4 easy / 8 medium / 8 hard MCQs (each request permits only its assigned difficulty), validate structure and server-derived source evidence, shuffle answer positions (five each, no three consecutive identical keys), then independently review source grounding and pedagogical quality. Each batch is checked for count, difficulty and evidence; prior questions are supplied to the next batch to avoid duplication. The merged 20 items receive the full structural and semantic review. One bounded revision is allowed. This uses three generation requests instead of one, so latency and input-token usage can increase. Insufficient material or failed review stops publication and preserves the saved lesson.

Questions keep existing `prompt`, `choices`, `correct` (zero-based), `explanation`, `concept_id`, `reference` fields and add `difficulty` and `questionType`. New quizzes use 4 easy / 8 medium / 8 hard and at least four supported cognitive types. Semantic review checks redundancy, coverage, distractors, ambiguity and unsupported premises; this is a heuristic and cannot guarantee absence of hallucinations.

Apply `202610020008_grounded_quiz.sql` before deploying the updated analyze-content worker. It persists metadata and serves all 20 new questions in one attempt. Existing banks keep the original 10-question retest behavior. Existing quizzes are not regenerated automatically. Answer keys remain private until server grading.

Validation: `npm test`, `npm run typecheck:worker`, `npm run build`, `npm run lint`. Quiz tests use a sample source and a deterministic mock provider to verify the orchestration, grounding checks, repair limits, answer remapping and failure handling; database integration tests verify migration, 20-item attempts and grading. They do not certify the quality of live Gemini output. A live provider trial requires server-side Gemini configuration.


The quiz model now selects passage_id from server-supplied passages instead of copying excerpts and page metadata. The server attaches original source text and verifies it against the upload. Semantic review still checks the actual question, answer, explanation and selected context against the whole lesson. Verified quotation means the excerpt exists, not that the question is factually correct. This supports original within-lesson application and likely-outcome scenarios without failing on AI quotation transcription.

