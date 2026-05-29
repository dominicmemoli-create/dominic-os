# Design System

Dominic OS uses a premium black health-tech system inspired by the concept reference: compact telemetry, glass cards, subtle cinematic glow, mono numerals, and mobile-first spacing.

## Tokens

Core tokens live in `css/styles.css`.

- **Backgrounds**: deep black base, radial green/cyan washes, subtle grid/dot texture.
- **Surfaces**: `--grad-panel`, card glass, elevated ticker/nav surfaces.
- **Borders**: low-contrast glass borders plus stronger focus/active borders.
- **Accents**: green for optimal/action, cyan for hydration/recovery, gold for effort/attention, red for stalled/missed.
- **Typography**: system sans for UI, JetBrains Mono stack for numerals and telemetry.
- **Spacing**: mobile-first gaps and padding with larger desktop shell spacing.
- **Radius**: compact premium radii, with large hero cards and pill nav controls.
- **Z-index**: ticker, nav, modal, and toast layers are explicit.
- **Controls**: buttons, inputs, selects, nav items, and modal actions are at least 44px high.

## Components

- `pageHero()`: cinematic top card with actions, metric tiles, and a reusable graphic.
- `pageGraphic()`: orbital, focus lanes, muscle map, recovery, school, admin, and review visuals.
- `premiumEmpty()`: visual empty state with clear add/start action.
- `metricRing()` and `sparkline()`: lightweight data visuals.
- `dataBackupCard()`: export/import, load demo, and start fresh flows.
- Gym exercise visuals: generated SVG/CSS instruction placeholders with muscle/equipment labels and movement cues.

## Page Graphics

- Today: orbital day-progress/energy visual.
- Productivity: focus-lane command graphic.
- Gym: futuristic body/muscle map.
- Health: recovery ring and hydration bottle motif.
- School: semester card stack.
- Admin: control-panel grid.
- Review: analytics/radar graphic.

## Mobile Rules

- No page-level horizontal overflow.
- Grid/flex children use `min-width: 0`.
- Long text uses defensive wrapping.
- Floating nav uses safe-area bottom positioning.
- Main content has bottom padding larger than nav height.
- Mobile hero graphics become background art so they do not push controls below the fold.
- Scrollable rails are used for ticker, split, and tab surfaces.

## Visual Restraint

The palette is not neon-first. Glow is used for state and depth, not decoration. Default pages must still look premium when empty, so non-gym fake data is hidden unless demo mode is explicitly loaded.
