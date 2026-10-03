# Frontend / backend origin repair — 2026-10-03

The hosted frontend origin is https://learn-pilot-blush.vercel.app. Browsers
derive Origin from the page URL; VITE_SUPABASE_URL selects the backend, not the
frontend Origin. The worker checks Origin before OPTIONS/authentication and
returns 403 unless it matches an allowed APP_ORIGIN entry. Requests without
Origin still require bearer authentication for analysis.

Before this repair, live OPTIONS returned 200 for the hosted frontend and
http://localhost:5174, but 403 for http://localhost:5173,
http://localhost:4173 and http://127.0.0.1:4173. Preview called Supabase directly,
and Vite could silently move the dev server to another port.

The canonical list is now supabase/functions/_shared/app-origins.ts. Dev uses
5173 and preview uses 4173, both with strictPort. Both local modes route functions
through the same-origin Vite proxy, preserving authentication, query and body.
Production continues to call Supabase directly. Backend URL normalization accepts
a trailing slash and canonical URL casing/default ports, while rejecting paths,
queries, credentials, wildcards and unlisted domains/ports.

Run npm run deploy:backend to sync APP_ORIGIN from that file, deploy the worker,
and verify live preflights. npm run check:origins can verify separately without
calling Gemini. Update the canonical list when adding a frontend domain.

APP_ORIGIN was synchronized and analyze-content deployed to project
rmodpumcfenpaotvyttb. Live preflight verification passed for production and all
six configured localhost/127.0.0.1 origins. Untrusted and lookalike domains,
localhost:3000 and null returned 403 without Access-Control-Allow-Origin.

Build, lint and worker typecheck passed. Integration tests cover both Vite dev
and production preview proxies, including preserved auth/body/query and a 401
backend response. This verifies routing/CORS, not Gemini generation or quiz
quality. The frontend changes are saved and built locally; this repair deployed
the Supabase backend, not the Vercel frontend.
