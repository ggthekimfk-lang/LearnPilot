# LearnPilot — Penguin reference adaptation

The supplied RAR is a visual reference. Its HTML, scripts, example content and
non-verbal/skeleton rendering policy are not part of the application.
All ten screen screenshots, their HTML, the Aura Learn design document and the
three standalone illustration assets were inspected before implementation.

## Extracted visual system

- Canvas: `#F9F9F9`; sky: `#BAE6FD` / `#E0F2FE`; primary ink-blue: `#396477`.
- Action/success: `#006E2F`, with mint `#C4FBD2`; lavender: `#E0E7FF`;
  amber: `#FEF3C7`; rose: `#FFE4E6`; text: `#1A1C1C` / `#41484C`.
- Cards: white, 32px corners, 24–32px padding; diffuse sky-tinted shadows.
- Buttons: capsule geometry, minimum 48px touch targets; green primary,
  sky-blue secondary, transparent tertiary; pressed scale of 0.96.
- Fonts: Plus Jakarta Sans and Noto Sans Thai. Headings use 600 weight;
  readable text and Thai line spacing replace the reference's skeleton bars.
- Background: original scenic illustration on authentication; subtle sky/mint
  radial surfaces on feature and profile cards.
- Profile: circular penguin avatar, sky frame, pastel statistic chips using real
  material/attempt counts and the user's study-time preference.
- Navigation: line icons and sky selected capsules; five mobile destinations
  preserve access to settings. Desktop retains usable text navigation.
- Progress: rounded 12px tracks with sky-to-green fill; values come from real
  plan tasks or quiz answers, without fabricated XP, levels or achievements.
- Interaction: short color/press transitions, restrained avatar tilt on hover;
  reduced-motion preference disables animation and transitions.
- Decoration: existing illustrated clouds, hills, trees, penguin goggles and
  celebration artwork. No decorative controls imply unavailable features.

## Assets and files

Original standalone images copied without image modification:

- `public/penguin/mascot.png`: penguin explorer logo.
- `public/penguin/landscape.png`: scenic welcome illustration.
- `public/penguin/celebration.png`: result illustration.

Added `src/leanpilot/Mascot.tsx` as a decorative reusable component and
`src/leanpilot/penguin.css` as the active reference theme. Updated
`src/leanpilot/LeanPilot.tsx`, `src/leanpilot/Account.tsx`, `index.html`, `public/manifest.webmanifest` and
`vite.config.ts` to apply the theme, font and offline asset cache.
The earlier `stitch.css` theme is no longer imported.

## Content and behaviour boundaries

No reference HTML or JavaScript was imported into application code. No example
names, lessons, questions, answers, scores, plans, XP or levels were added.
Existing Supabase calls, AI analysis, quiz scoring, preferences and offline
data flow remain unchanged. Empty states continue to describe absent data.
All images used in the application are standalone illustrations without text.

## Verification

- Production build and ESLint passed after the final edits.
- Local app and all three illustration URLs returned HTTP 200.
- Built service worker includes the illustration assets in its precache.
- Browser screenshots confirmed the updated home and account layouts at the
  current narrow viewport. Populated summary/quiz/result screens could not be
  verified because the connected Supabase reports missing LearnPilot schema.
  This is an existing backend configuration issue; no database changes were
  made for the visual redesign.
