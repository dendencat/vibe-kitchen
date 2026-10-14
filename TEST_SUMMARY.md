# Test Summary

| Suite | Tool | Result |
| --- | --- | --- |
| Unit & integration | Vitest 5 + jsdom | **28 files, 265 tests, all passing** |
| Coverage (v8) | `npm run test:coverage` | **100 %** statements, branches, functions, lines (enforced threshold) |
| End-to-end | Playwright 1.56 (Chromium, SwiftShader WebGL) | **7 scenarios, all passing** |
| Static checks | `tsc --noEmit` (strict), ESLint, Prettier | clean |

## What is covered

| Area | Files | Highlights |
| --- | --- | --- |
| Utilities | `MathUtils`, `SecurityValidator`, `Constants`, `Storage` | XSS stripping, numeric validation edge cases, storage failures never throw |
| Localization | `Localization` | `en`/`ja` key parity, placeholders, fallbacks, DOM attribute application |
| Game model | `Simulation`, `GameState`, `MarketEvents`, `GameEngine` | exact 7 × 60 s length, capacity overflow, every action success/failure reason, snapshots and invalid saves |
| Balance | `Balance.test.ts` | seeded whole-game runs: active player wins on Easy, Hard ranks worse than Easy, idling does not win |
| AI | `AIStrategies`, `AIController`, `SupportAI` | each rival's behaviour, throttling, affordability filter, advice priority/cooldown/variant rotation |
| Audio | `notes`, `tracks`, `AudioManager` | note parsing, every track's length, scheduler with a fake `AudioContext`, all SFX, mute/volume, unavailable audio |
| 3D logic | `SceneLayout`, `CrowdSimulator` | shop orientation, lighting by time/weather, camera framing, walker lifecycle |
| UI | `ui/*.test.ts` | each component in jsdom: tabs/keyboard, price stepper, dish dialog validation, focus trap, toasts with undo, results screen |
| App | `App.test.ts` | title → game → results with fake scene/audio: shortcuts, settings, language switch, autosave/continue, events, selection |

Excluded from unit coverage (need a real GPU/browser, covered by Playwright):
`src/three/SceneRenderer.ts`, `src/main.ts`.

## End-to-end scenarios (`e2e/game.spec.ts`)

1. Title renders the WebGL plaza; language switch; track selection; starting a
   game with a name containing HTML (rendered as sanitized text).
2. Core loop: clock runs, a campaign shows feedback, a dish is added, pause
   freezes time, `Esc` resumes.
3. Clicking the player's shop in 3D opens the intel card.
4. A full game reaches the results screen (6 rows, 4 awards) and can be replayed.
5. Reload + **Continue** restores an autosaved game.
6. 390 px wide layout has no horizontal overflow.
7. BGM: the `AudioContext` is created only after a user gesture, keeps scheduling notes, and stops when switched to *Off* (instrumented real Web Audio).

Scenarios 1 and 2 also fail on any console error or page error, which includes
CSP violations.

## Running

```bash
npm test                 # unit + integration
npm run test:coverage    # with the 100 % gate
npm run test:e2e         # builds, serves dist/ and runs Playwright
```
