# AI Restaurant Battle — Instruction Manual / 操作説明書

This manual describes every screen and control of version 2 (3D redesign).
日本語の要約は各節の末尾にあります。

---

## 1. Title screen / タイトル画面

| Element | What it does |
| --- | --- |
| **EN / 日本語** (top right) | Switches the language everywhere, including the 3D signs |
| **Restaurant name** | Your shop's sign (max 24 characters; HTML characters are removed) |
| **Difficulty** | Easy / Normal / Hard — scales how strongly the AI rivals attract guests (×0.8 / ×1.0 / ×1.2) |
| **Background music** | Pick one of four pop tracks or *Off*. Clicking a track previews it immediately |
| **Open the restaurant** | Starts a new 7-day game |
| **Continue** | Appears when an autosave exists (saved every 30 s and when you quit) |
| **How to play** | Short rules summary |

The 3D plaza slowly orbits behind the card.
*日本語：店名・難易度・BGM を選んで「お店をオープン」。オートセーブがあれば「つづきから」が表示されます。*

---

## 2. Top bar (HUD) / 上部バー

- **Day X / 7** with seven pips (done / current / upcoming).
- **Day progress bar** — white markers show the lunch (35 %) and dinner
  (75 %) rushes. Below it: phase (Morning, Lunch rush, Afternoon, Dinner
  rush, Late night), time left (`m:ss`) and today's weather.
- **Cash** (with today's profit), **Guests** (total served; shows a warning
  when guests are turned away), **Satisfaction** (turns red under 50 %),
  **Share** (your market share). Chips flash green/red on big changes.
- **🎵** mute, **⏸** pause menu, **⚙** settings (also pauses).

*日本語：日数・時間帯（ランチ/ディナーのピーク）・残り時間・天気、現金/来客数/満足度/シェアを表示。右端はミュート・一時停止・設定。*

---

## 3. 3D plaza / 3D 広場

- Six shops around the sakura tree. Yours is at the front with a pink
  diamond marker and a pulsing ring.
- **Pillars** next to each shop grow with market share; the floating badge
  shows rank and share. A **crown** floats over the current leader.
- **Guests** walk in from the edges, enter, and leave. Grey guests were
  turned away because the shop was full.
- The sky follows the time of day (sunrise → noon → sunset → night with
  glowing windows and street lamps). Rain and clouds follow the weather.
- **Drag** to orbit, **scroll/pinch** to zoom, **click a shop** to show its
  intel card. Confetti marks campaigns, hires and upgrades.

*日本語：柱の高さ＝シェア、王冠＝首位。灰色のお客様は満席で帰った人。ドラッグで回転、クリックで偵察。*

---

## 4. Left panel / 左パネル

- **Live ranking** — rows slide into their new order as shares change; your
  row has a **YOU** badge. Click a row to select that restaurant.
- **Revenue** — cumulative revenue of all six restaurants (yours is the thick
  pink line).

---

## 5. Right panel — Sakura / 右パネル（サクラ）

- **Rival intel** (when a shop is selected): strategy, rank and share,
  revenue, satisfaction, average price, staff and buzz.
- **Advice feed** — the three latest tips. Warnings are red, opportunities
  green. **Show me →** opens the control tab the tip is about.
- **Market events** — active events with an icon and a timer bar:
  Rainy day (−30 % traffic), Local festival (+50 %), TV feature (your
  satisfaction rises), Ingredient price spike (+30 % food cost).

*日本語：ショップ選択時はライバル情報、サクラの助言（「開く」で該当タブへ）、市場イベントと残り時間。*

---

## 6. Control dock / 操作ドック

Switch tabs with the mouse, `1` `2` `3`, or arrow keys.

### Menu / メニュー
Each dish card shows price, popularity, margin and rating.
- **− / +** change the price by $0.50 (instant, no dialog).
- **✕** removes the dish; the toast offers **Undo**. At least one dish must
  remain; the menu holds up to 10.
- **+ Add dish** opens a dialog with **quick picks**, name, price, cost and
  a cook-time slider. A live **margin preview** turns red under 20 %. Cost
  must be lower than price. Slower dishes earn higher ratings but reduce
  kitchen throughput.

### Marketing / マーケティング
| Campaign | Cost | Effect |
| --- | --- | --- |
| Social media | $2,000 | Quick, cheap buzz |
| Radio spot | $5,000 | Solid buzz |
| TV commercial | $12,000 | Huge buzz + 3 satisfaction |

**Buzz** multiplies how attractive you are and fades about 1.5 % per second.
Buttons are disabled when you cannot afford them.

### Operations / 運営
- **Chef** (+2 guests/s, $600/day, $1,500 to hire) and **Waiter**
  (+1.5 guests/s and happier guests, $450/day, $1,000) — up to 5 each.
- **Kitchen upgrade** — +15 % capacity per level (Lv 1–5), cost $4,000 × level.
- **Load** — demand ÷ capacity. Above 100 % guests are turned away.

*日本語：メニューは −/+ で即価格変更、✕で削除（元に戻す可）。マーケは3種のキャンペーンで「話題度」を上げる。運営はシェフ/ホール雇用と厨房強化、混雑率で満席を確認。*

---

## 7. Pause menu & settings / 一時停止・設定

Opened with **⏸**, **⚙**, `Space` or `P`. The game is paused while open.
- Music track, music volume, sound effects volume, mute.
- Graphics: **High** (shadows, high-DPI) or **Battery saver**.
- Language, keyboard shortcuts, **Quit to title** (saves progress),
  **Resume** (or `Esc`).

---

## 8. Results / 結果画面

After day 7: your placement, a podium for the top three, the full table
(share, revenue, satisfaction, score) and four awards — Revenue leader,
Satisfaction champion, Efficiency master (revenue ÷ expenses) and Innovation
award (most dishes added/removed). **Play again** keeps your name and
difficulty; **Title** returns to the title screen.

---

## 9. Keyboard shortcuts / ショートカット

| Key | Action |
| --- | --- |
| `Space` / `P` | Pause menu |
| `1` `2` `3` | Menu / Marketing / Operations |
| `←` `→` (on tabs) | Previous / next tab |
| `M` | Mute music & effects |
| `Esc` | Close the open dialog |
| `Tab` | Move focus (focus is trapped inside dialogs) |
