# Screenshot Guide

README screenshots live in `docs/images/` and are produced by
`scripts/capture-screenshots.mjs` (Playwright + the preinstalled Chromium,
software WebGL via SwiftShader).

```bash
npm run build
npm run preview &                      # serves dist/ on http://localhost:4173
node scripts/capture-screenshots.mjs   # [baseUrl] [outDir]
```

The script uses the Japanese UI and captures:

| File | Scene |
| --- | --- |
| `title.jpg` | Title screen over the orbiting 3D plaza |
| `game-day.jpg` | Day 2 around lunch |
| `game-dusk-rain.jpg` | Day 3 dinner rush in the rain, right after a TV campaign |
| `results.jpg` | Results screen with podium and awards |
| `mobile.jpg` | 390 × 844 phone layout |

It drives the game through the debug handle `window.__app`
(`__app.get_engine().tick()`) to fast-forward time, so the shots are
reproducible without waiting seven minutes.

To capture manually, open the preview in a browser at 1280 × 720 and use the
browser's screenshot tool.
