# Mobile QA

Date: 2026-05-29

## Matrix

Routes checked:

- `#/today`
- `#/productivity`
- `#/gym`
- `#/health`
- `#/school`
- `#/admin`
- `#/review`

Viewports checked:

- `375x812`
- `390x844`
- `430x932`
- `768x1024`
- `1440x900`

Post-redesign screenshots are in `audit-screenshots/post/`.

## Results

- No broken image URLs are used by the UI. Gym uses intentional generated placeholders unless a user supplies an image URL.
- Mobile hero artwork was reduced to a background layer so it no longer forces controls below the fold.
- Hero titles and copy were shortened and wrapped defensively.
- The floating bottom nav is safe-area aware and main content has bottom padding for final controls/forms.
- The seven app sections are reachable on mobile through five primary tabs plus More.
- Exercise cards collapse on narrow screens and keep visual, stats, cue, swap, and log actions together.
- Forms and modal bodies use responsive widths and scrollable modal content.

## Tooling

- Browser plugin Node bridge was attempted but unavailable in this sandbox.
- Edge/CDP target crashed under headless automation.
- Chrome headless old mode with `--single-process` successfully produced the screenshot matrix.

## Residual Risk

- Because CDP evaluation was unavailable, overflow and console checks were verified by screenshots, JS syntax checks, module import checks, and manual visual inspection rather than automated DOM metrics.
- The fixed nav intentionally floats over the viewport like the concept image; page bottom padding prevents final content from being unreachable behind it.
