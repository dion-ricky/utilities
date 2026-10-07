# Stage 6 — CSS & Design Tools (13 tools)

## Goal

Visual generators with the shared pattern: **controls → live preview → generated code → copy**.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | Contrast checker | `contrast-checker` | WCAG 2.1 ratio math; AA/AAA badges; EyeDropper API pickup |
| 2 | CSS gradient generator | `css-gradient` | linear/radial/conic; multiple stops; angle dial |
| 3 | Box shadow generator | `box-shadow` | layered shadows; inset; live preview |
| 4 | Border radius generator | `border-radius` | per-corner + "squircle" preview |
| 5 | Cubic-bezier editor | `cubic-bezier` | SVG curve drag; animate a demo ball; timing presets |
| 6 | CSS animation generator | `css-animation` | keyframes builder; duration/delay/easing; live loop |
| 7 | Glassmorphism generator | `glassmorphism` | blur/transparency/noise presets |
| 8 | Neumorphism generator | `neumorphism` | light/dark surface presets |
| 9 | Flexbox playground | `flexbox-playground` | all container/item props; generated CSS |
| 10 | CSS grid playground | `grid-playground` | template areas editor; generated CSS |
| 11 | Image → CSS background | `image-to-css` | FileReader → data URI; size/repeat/position code |
| 12 | SVG wave generator | `svg-wave` | layered paths; amplitude/wavelength; SVG + CSS snippet |
| 13 | Color palette generator | `palette-generator` | harmonies (comp/analog/triadic) from base color; export CSS vars/JSON/Tailwind |

## Acceptance criteria

- [ ] 13 tools deployed with consistent live-preview interaction pattern.
- [ ] Generated code verified by rendering it back (preview uses the exact generated CSS).
- [ ] Contrast math matches WCAG reference values on a test matrix.
- [ ] Release tagged.
