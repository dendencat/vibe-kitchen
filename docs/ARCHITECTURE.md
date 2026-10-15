# Architecture

AI Restaurant Battle is a single-page TypeScript app bundled by Vite. The game
model is framework-free and view-agnostic; the 3D scene, the DOM UI and audio
only observe it.

```
           ┌─────────────── App.ts (orchestrator) ────────────────┐
 input ──▶ │ TitleScreen · Hud · RankingPanel · RevenueChart       │
           │ AdvisorPanel · ActionDock · DishModal · SettingsModal │
           │ GameOverModal · Toasts                                │
           └───────┬───────────────┬────────────────┬─────────────┘
                   │ actions       │ events          │ sync / traffic
             ┌─────▼─────┐   ┌─────┴──────┐   ┌──────▼────────┐
             │ GameEngine │──▶ GameEvent  │   │ SceneRenderer │ (three.js)
             │ (1 s ticks)│   │ listeners  │   │ CrowdSimulator│
             └─────┬─────┘   └────────────┘   └───────────────┘
        ┌──────────┼──────────────┐                ┌────────────┐
   Simulation  MarketEvents  AIController ×5       │AudioManager│ (Web Audio)
   (formulas)                 └ AIStrategies       └────────────┘
```

## Modules

| Path | Responsibility |
| --- | --- |
| `src/main.ts` | Browser entry: imports styles/fonts, creates `App` with real dependencies |
| `src/App.ts` | Wires engine ⇄ UI ⇄ scene ⇄ audio, settings, autosave, shortcuts. Dependencies are injected so it is unit-tested in jsdom with fakes |
| `src/game/GameEngine.ts` | Fixed one-second ticks, action validation, day/game-over flow, snapshots |
| `src/game/Simulation.ts` | Pure economic formulas (demand curve, attractiveness, capacity, satisfaction, scoring) |
| `src/game/GameState.ts` | State factory and helpers |
| `src/game/MarketEvents.ts` | Random events with durations in simulated time |
| `src/ai/AIStrategies.ts` | Five rival strategies returning `PlayerAction`s |
| `src/ai/AIController.ts` | Throttles each rival and filters unaffordable actions |
| `src/ai/SupportAI.ts`, `AdviceTemplates.ts` | Sakura's diagnosis and bilingual messages |
| `src/three/SceneRenderer.ts` | three.js scene (WebGL glue, covered by Playwright) |
| `src/three/SceneLayout.ts` | Pure layout, palette, lighting and camera framing math |
| `src/three/CrowdSimulator.ts` | Pure walker simulation for guests |
| `src/audio/AudioManager.ts` | Look-ahead music scheduler, synth voices and SFX |
| `src/audio/tracks.ts`, `notes.ts` | Original tracks in a tracker-style text format and its parser |
| `src/ui/*` | DOM components built with `h()` (text only via `textContent`) |
| `src/localization/*` | Typed EN/JA string tables (`ja` must match the shape of `en`) |

## Game loop

`App.frame()` runs on `requestAnimationFrame`. It feeds elapsed wall time to
`GameEngine.update()`, which runs as many one-second `tick()`s as are due
(large gaps such as a background tab are capped to one tick). Each tick:

1. AI controllers decide (every 5 s, staggered) and act through
   `execute_action` — the same validation the player gets.
2. `simulate_market()` splits demand between restaurants by attractiveness,
   caps it by capacity, and updates money, satisfaction, popularity and buzz.
3. Market events age and may roll.
4. Shares are recalculated; day 7's last second ends the game.

The engine emits `tick`, `day-start`, `market-event`, `action` and `game-over`
events. The UI re-renders panels on ticks; the HUD and 3D scene update every
frame for smooth clocks, lighting and animation.

## 3D scene

- The plaza is framed inside the free area between the UI panels:
  `App.update_free_area()` measures `#stage` (or the space beside the title
  card) and `SceneRenderer.set_free_area()` applies `camera.setViewOffset()`
  and a matching distance (`frame_camera()` in `SceneLayout`).
- Guests are two `InstancedMesh`es (bodies, heads) driven by
  `CrowdSimulator`; one walker spawns per ~3 served guests. Turned-away guests
  walk to the door and leave greyed out.
- Day progress drives sky, fog, sun angle/colour and window/lamp glow
  (`lighting_for()`); weather blends clouds and rain.
- “Battery saver” quality disables shadows and caps pixel ratio at 1;
  `prefers-reduced-motion` stops auto-rotation and slows particles.
- No WebGL → `SceneRenderer.create()` returns null and the UI shows a notice;
  the game stays playable.

## Audio

`AudioManager` creates its `AudioContext` lazily on the first user gesture
(autoplay policy). A 25 ms interval schedules notes 120 ms ahead on the audio
clock. Voices: square/saw/triangle lead with a feedback echo, filtered bass,
chord stabs or arpeggios, and synthesized kick/snare/hat (noise buffer).
Tracks are text like `E5 - G5 . A5` (one token per 16th note: note, `-` tie,
`.` rest) compiled once into a per-step timeline (`compile_track`).

## Balance

Tuned with headless whole-game simulations (now pinned by
`src/game/Balance.test.ts` using a seeded RNG):

- Base demand is 4 guests/s per restaurant, shaped by lunch/dinner peaks;
  each guest orders ~3 plates. An average restaurant is modestly profitable;
  marketing and hiring are what push expenses up.
- Capacity (staff × kitchen level × cook-time factor) starts around 4 guests/s,
  so popular restaurants hit their limit at rush hours — hiring matters.
- Price appeal is linear in market-average / own-average price; satisfaction
  weighs heavily (`0.2 + 1.2·s^1.5`) so service-focused rivals stay viable.
- Campaign buzz uses diminishing returns (`0.35·log2(1 + budget/2000)`) and
  decays 1.5 %/s, so stacking campaigns is less efficient than spacing them.
- A scripted “active” player wins every seeded game on Easy, places around 2nd
  on Normal and lower on Hard; an idle player finishes in the bottom half.

## Testing

- **Vitest + jsdom**: 100 % statements/branches/functions/lines (enforced).
  `SceneRenderer.ts` and `main.ts` are excluded because they need a real GPU /
  browser; they are exercised by Playwright.
- **Playwright** (`e2e/`): title → game, the core loop, 3D shop picking,
  a full game to the results screen, reload + Continue, and a mobile layout
  check, and real Web Audio scheduling of the BGM. The title and core-loop
  scenarios also fail on console errors (including CSP violations).
