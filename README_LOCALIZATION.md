# Localization / ローカライズ

The game ships in **English** and **Japanese**. The initial language follows
the browser (`ja*` → Japanese) and is saved in the settings.

## How it works

- String tables live in `src/localization/strings.ts`. `ja` is declared with
  the type of `en` (`Strings`), so a missing or extra key is a **compile
  error**; `Localization.test.ts` additionally checks both tables have
  identical keys.
- `localization.t('dotted.key', { name: 'value' })` resolves a string and
  fills `{placeholders}`. Missing keys fall back to English, then to the key.
- Static UI text is marked with `data-i18n` (text), `data-i18n-aria`
  (`aria-label`), `data-i18n-title` and `data-i18n-placeholder`.
  `h('span', { i18n: 'cash' })` sets the attribute and text in one go.
- On language change, `App` re-applies translations to the document, rebuilds
  language-dependent lists (menu cards, events) and re-draws the 3D shop
  signs via `SceneRenderer.set_names()`.
- AI restaurant names are localized at display time from `strategyType`.
  The player's restaurant name is whatever the player typed.
- Starting dishes and presets are localized when created (`dishes.*`).
- Sakura's advice has its own bilingual pools in
  `src/ai/AdviceTemplates.ts`; successive tips rotate through the variants.

## Adding a language

1. Add a table in `strings.ts`: `export const fr: Strings = { … }`.
2. Register it in `TABLES` in `Localization.ts` and extend the `Language`
   type in `src/types/UITypes.ts`.
3. Add advice pools to `AdviceTemplates.ts`.
4. Add a button in `TitleScreen.ts` and `SettingsModal.ts`.

## Fonts

“M PLUS Rounded 1c” (via `@fontsource`) is bundled locally, split by Unicode
range, so only the glyphs that are used get downloaded and the CSP can stay
`font-src 'self'`.
