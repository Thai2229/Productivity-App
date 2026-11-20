# Design system

Calm, exact tool. White / ink / mint in light, soot with a mint action in dark. Flat grounds, hairline rules over boxes,
one accent for "the thing that is on / done / now". Tokens: `src/index.css`. Primitives and shell: `src/App.css`.
Never invent colours, radii, shadows or fonts in a page CSS file; use the tokens.

## Tokens (every theme defines all colour tokens)
Colour: `--bg` page, `--surface` (#f3f3f3) quiet fill, `--surface-2` stronger fill / hover on surface, `--raised` menus and
segmented thumb, `--ink`, `--muted` (text, AA on bg and surface), `--line` hairline, `--line-strong` input borders /
dividers that must show, `--dot` (= line-strong), `--accent` + `--accent-ink` (mint FILL with ink text; never mint text on
white), `--action` + `--action-ink` (primary button: ink fill in light, mint in dark), `--focus` ring, `--danger`,
`--ok` (success text/fill), `--shadow-pop` (menus only).
Legacy, still valid: `--work` (= the action colour, usable as text/fill in every theme), `--rest` (blue, not green),
`--long` (amber), `--on-accent` (text on a `--work` fill), `--phase` (set per page; Pomodoro sets it per phase).
Use `--ok` for success, not `--rest`. Pages that set `--phase: var(--work)` can keep doing so.
Type: `--font-display` / `--font-text` Host Grotesk, `--font-mono` JetBrains Mono. Display = weight 500, tracking
`--display-tracking` (-0.035em); h1-h3 get this globally. Mono for numbers, dates, counts, times, ids.
Scale: `--text-xs` 12, `--text-s` 13, `--text-m` 15 (body), `--text-l` 18, `--text-xl` 24, `--text-2xl` 28-36 fluid (page
title), `--text-3xl` 40-56 fluid. Weights: 400 text, 500 labels/buttons/titles. No 600+. Sentence case everywhere.
Space (4px base): `--space-1..8` = 4 8 12 16 24 32 48 72. Page gutter `--page-pad` (fluid 16-32).
Radius: `--radius-s` 6 (buttons, inputs, nav, rows), `--radius-m` 10 (menus, segmented, swatches), `--radius-l` 14 (panels).
Tags use 4px. Circles only for true dots/checkmarks. No pills.
Control height `--control-h`: 36px, 44px on coarse pointers. Use it for any button/input/row you make clickable.

## Shell
`<main class="page">` is max-width 72rem, centred, padded. A page narrows itself with `.page:has(.mypage){max-width:...}`
(already how pages do it). Navbar: sticky, hairline, the active link is the one mint tile (`.nav-link.active`).

## Primitives (App.css; plain classes, combine freely)
- Buttons: `.btn` + one of `.btn-primary` (one per screen; ink/mint), `.btn-secondary` (quiet fill), `.btn-outline`
  (hairline), `.btn-ghost` (text only), `.btn-danger`, `.btn-danger-outline`. Sizes `.btn-small`, `.btn-lg`.
  Icon button: `.btn.btn-icon` with an svg (stroke 1.5, currentColor) and `aria-label`.
- Inputs: bare `input`, `select`, `textarea` already look right (zero-specificity defaults, so your class wins).
  Explicit: `.input`, `.select`, `.textarea`. Label stack: `.field` > `.field-label`, control, `.field-hint`.
  Errors: `.auth-error` (danger colour) or your own with `var(--danger)`.
- Page header: `<header class="page-header"><div><h1 class="page-title">Title</h1><p class="page-meta">4 open · 1 done</p></div>
  <div class="page-actions">...</div></header>`. Hairline underneath. Meta is mono, muted.
- Segmented control: `<div class="segmented"><button aria-pressed="true">Board</button>...</div>`; active is
  `aria-pressed|aria-selected|aria-current="true"` or `.is-active`. Children are `button` or `a`.
- Tag: `.tag` (neutral), `.tag-accent` (mint, for "now/done"), `.tag-outline`. Max one tag colour per row.
- Empty state: `.empty` > `.empty-title`, `.empty-text`, then a `.btn`. Left aligned, one sentence.
- Misc: `.panel` (surface, radius-l, one level only), `.rule` (hairline hr), `.meta` and `.mono` (mono, tabular).
- Menus/popovers: background `var(--raised)`, `box-shadow: var(--shadow-pop)`, radius-m, items radius-s with
  `--surface-2` hover (see `.profile-menu`). That is the only place a shadow is allowed.
- Focus: `outline: 2px solid var(--focus); outline-offset: 2px` on every interactive element.

## Do
- Separate with hairlines (`1px solid var(--line)`) and space before reaching for a card.
- Put numbers, dates, counts in `--font-mono` with `tabular-nums`.
- Use mint (`--accent`) as a fill for the single active/done thing; text on it is `--accent-ink`.
- Check light, dark and one extra theme (midnight, crimson) at 1440 and 390. 44px targets on touch.
- Honour `prefers-reduced-motion`; transitions 150ms, colour/opacity only.

## Don't
- No gradients (except sunset's page ground), glows, emoji as icons, coloured left-border stripes, nested cards,
  pill badges, status dots on everything, centred narrow columns with dead space.
- No `--work`/`--accent` as text colour on `--bg` in light unless you mean ink; mint text fails contrast on white.
- No hard-coded hex/px radii/shadows; no font sizes outside the scale; no weight above 500.
- Don't style `.btn` per page; add a modifier class that only changes layout (width, margin).
- Global `box-sizing: border-box` is on; do not rely on content-box.
