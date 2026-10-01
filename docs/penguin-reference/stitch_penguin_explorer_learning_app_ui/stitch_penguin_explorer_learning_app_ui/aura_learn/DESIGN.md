---
name: Aura Learn
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#41484c'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#71787c'
  outline-variant: '#c1c7cc'
  surface-tint: '#396477'
  primary: '#396477'
  on-primary: '#ffffff'
  primary-container: '#bae6fd'
  on-primary-container: '#3d687c'
  inverse-primary: '#a1cde3'
  secondary: '#006e2f'
  on-secondary: '#ffffff'
  secondary-container: '#6bff8f'
  on-secondary-container: '#007432'
  tertiary: '#575e72'
  on-tertiary: '#ffffff'
  tertiary-container: '#d8dff7'
  on-tertiary-container: '#5b6276'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bee9ff'
  primary-fixed-dim: '#a1cde3'
  on-primary-fixed: '#001f2a'
  on-primary-fixed-variant: '#1e4c5f'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#dbe2fa'
  tertiary-fixed-dim: '#bfc6dd'
  on-tertiary-fixed: '#141b2c'
  on-tertiary-fixed-variant: '#3f4759'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  visual-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 48px
  visual-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 36px
  visual-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 32px
  visual-heading:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 24px
  visual-subheading:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 20px
  visual-lead:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 16px
  visual-standard:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 14px
  visual-dense:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 12px
  visual-micro:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 10px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

The design system establishes a gentle, highly intuitive visual environment tailored for early developmental learning, language-agnostic training, and frictionless cognitive exploration. By stripping away text entirely, the interface eliminates literacy barriers, sensory friction, and linguistic load. The experience communicates exclusively through form, motion, iconography, spatial grouping, and radiant pastel tones.

The aesthetic fuses modern iOS minimalism with playful tactile softness:
- **Clean Tactile Minimalism:** Generously radiused planar surfaces, crisp iconography, and expansive white space recreate a warm, physical play-tray feel.
- **Micro-chromatic Feedback:** Progress, state shifts, and task completions are signaled purely through tinted surface states, energetic green chromatic blooms, and fluid icon state transitions.
- **Language-Free Interaction:** Layouts leverage strict semiotics, visual affordances, skeleton rhythm blocks, and geometric badges instead of alphanumeric characters.

## Colors

The palette balances weightless atmospheric tints with decisive semantic cues. Every tone is optimized for cognitive warmth, emotional security, and non-verbal feedback.

### Key Roles
- **Primary Canvas & Interactive Surfaces (`#BAE6FD` / `#E0F2FE`):** Soft sky tones define primary touch targets, interactive toolbars, active focus rings, and visual grounding planes.
- **Action & Validation Accent (`#22C55E` / `#16A34A`):** Pure energetic emerald denotes success, forward progression, active milestones, and high-priority interactive nodes.
- **Secondary Modality (`#E0E7FF`):** Soft lavender/indigo creates quiet separation for secondary interaction nodes, passive category buckets, and ambient containers.
- **Alert & Discovery Accents:**
  - **Pastel Amber (`#FEF3C7`):** Marks in-progress tracks, pending challenges, and neutral attention nodes.
  - **Pastel Rose (`#FFE4E6`):** Identifies cancellation gestures, reset nodes, or playful exploratory prompts.
- **Neutral Base (`#FFFFFF`):** High-clarity pure white serves as the universal card surface, floating above soft sky and lavender ground planes.
- **Muted Structural Chrome (`#94A3B8` / `#CBD5E1`):** Applied exclusively to non-alphanumeric structural geometry (glyph icons, inactive pill bars, skeleton tracks).

## Typography

This system strictly rejects alphanumeric characters, glyph scripts, and numeral forms. The typography tokens define a calibrated metric framework that governs scale, line-height proportions, and vertical rhythm for abstract structural blocks, skeleton glyphs, rounded horizontal content bars, and symbolic geometry.

### Implementation Architecture
- **Iconographic & Skeleton Height Anchor:** Each typography token dictates the baseline height and bounding bounding-box footprint for rounded horizontal visual bars and iconic badges.
  - `visual-hero`: Accommodates focal status emblems, reward illustrations, and master destination icons.
  - `visual-display` & `visual-heading`: Dictates the thickness and bounding bounds of section marker bars and primary symbol containers.
  - `visual-subheading` & `visual-lead`: Governs primary item skeleton bars and secondary visual anchors.
  - `visual-standard`, `visual-dense`, and `visual-micro`: Determines supportive skeleton line heights, auxiliary indicators, and micro-dot rhythms.
- **Rendering Policy:** Implementations replace any traditional text rendering layer with proportional rounded capsule geometries (`border-radius: 9999px`) tinted in subtle neutral or pastel shades.

## Layout & Spacing

Layouts follow an iOS-optimized, touch-centric fluid grid system structured entirely around thumb-zone ergonomics and card modularity.

### Grid Rhythm & Responsive Behaviors
- **Mobile Handheld (Base):** Single-column stack with an ambient margin of `margin-mobile` (16px) and interior card gutters of `gutter-mobile` (12px). Interaction items conform to minimum 48px tactile heights with `space-sm` (12px) separation between sibling modules.
- **Tablet / Expanded Handheld:** 2 to 4-column auto-flow grid utilizing standard `margin` (24px) and `gutter` (16px), allowing cards to settle into dual-pane visual browsing trays.
- **Structural Grouping:** Vertical sections deploy generous `space-xl` (36px) gaps to delineate task boundaries without relying on typographical headers. Inner card elements employ `space-md` (16px) padding to sustain an airy, uncrowded atmosphere.

## Elevation & Depth

Visual hierarchy is communicated via layered pastel planes, soft colored blurs, and translucent frosted backdrops.

### Surface Tiers & Ambient Shading
- **Layer 0 (Canvas Base):** Flat wash of `#E0F2FE` or `#F8FAFC`, establishing a calming, low-luminance sky foundation.
- **Layer 1 (Card Modular Platters):** High-reflectance `#FFFFFF` planes elevated with diffused multi-stop drop shadows:
  - `box-shadow: 0 8px 24px -4px rgba(186, 230, 253, 0.4), 0 2px 6px -1px rgba(148, 163, 184, 0.08);`
- **Layer 2 (Floating Action Targets & Badges):** Active controls and elevated status pucks suspended above white cards:
  - `box-shadow: 0 12px 28px -6px rgba(34, 197, 94, 0.35), 0 4px 10px -2px rgba(22, 163, 74, 0.15);`
- **Layer 3 (Navigation & Modal Sheets):** Ambient frosted layers utilizing `backdrop-filter: blur(20px)` over `rgba(255, 255, 255, 0.85)` with an ultra-thin highlight border `1px solid rgba(255, 255, 255, 0.6)`.

## Shapes

The interface embraces organic, pill-shaped geometry to evoke safety, friendliness, and tactile comfort. Sharp vertex angles are prohibited across all interactive and layout tokens.

- **Primary Radius (`roundedness: 3` / 1rem - 1.5rem):** Forms the corner architecture of secondary modular tiles, notification chips, and input wells.
- **Card Envelopes (`rounded-3xl` / 1.75rem - 2rem):** Outer bounding perimeters for primary functional cards, floating sheets, and dialog pods.
- **Capsules & Disks (`rounded-full` / 9999px):** Universal treatment for buttons, status badges, iconography containers, progress fills, and non-alphanumeric structural bars.

## Components

Components are entirely non-verbal, relying on pure iconographic iconography, proportional pill bars, skeleton blocks, and tonal contrast.

### Buttons & Tactile Nodes
- **Primary Hero Button:** Fully pill-shaped (`rounded-full`) capsule coated in vibrant green (`#22C55E`), housing a centered high-contrast white vector icon (e.g., play arrow, check mark, star). Height is fixed at 56px with a pressed transform state (`scale(0.96)`).
- **Secondary Atmospheric Button:** Sky blue tint (`#E0F2FE`) capsule supporting a `#0284C7` icon, elevated with subtle tinted shadow.
- **Floating Icon Puck:** Circular 48x48px `#FFFFFF` button carrying central symbolic glyphs with a gentle perimeter halo.

### Cards & Modules
- **Activity Pod:** Pure white (`#FFFFFF`) card with `rounded-3xl` geometry and ambient sky drop shadow. Inside, visual hierarchy is arranged with:
  1. An iconographic header badge (44x44px rounded container in `#FEF3C7` or `#FFE4E6`).
  2. A skeleton header bar (proportional height: 16px, width: 60%, `rounded-full`, `#E2E8F0`).
  3. A supporting skeleton block (proportional height: 10px, width: 85%, `rounded-full`, `#F1F5F9`).
- **Interactive Match Card:** Borderless `#FFFFFF` surface with an embedded central full-color illustration or geometric glyph. Features an active selection state rendered via a 3px inset ring of `#22C55E` and an interior wash of `#F0FDF4`.

### Chips & Filter Nodes
- **Symbolic Category Chip:** Pill container (`rounded-full`) sized at 40px height. Inactive state features an `#E0E7FF` background with a muted glyph. Active state elevates to `#BAE6FD` with a high-contrast glyph and a pulsing emerald status dot indicator.

### Progress & Milestone Indicators
- **Continuous Fluid Bar:** 12px tall continuous track in `#E2E8F0` (`rounded-full`) hosting an animated fill in `#22C55E` terminated by a luminous circular bead.
- **Segmented Milestone Stepper:** Row of circular icon nodes connected by horizontal stroke tracks. Completed nodes shift to `#22C55E` with embedded check vectors; active nodes pulse with `#BAE6FD` halos; future nodes sit in passive `#F1F5F9`.

### Selection Controls (Checkboxes & Radios)
- **Check Pucks:** 32x32px circular pods. Default state is an empty `#F8FAFC` circle with a subtle `#CBD5E1` boundary. Selected state transitions with a soft spring bounce into `#22C55E` featuring an inverted white check vector.
- **Toggle Swatches:** 56x32px pill track housing a 26x26px white sliding sphere, transitioning between `#E2E8F0` (inactive) and `#22C55E` (active).

### Visual Input & Selector Wells
- **Tactile Drop Zone / Input Well:** Recessed pill or rounded container with an interior drop shadow, `#F8FAFC` fill, and a dashed pastel border (`#BAE6FD`). A blinking rounded cursor bar marks active insertion readiness.