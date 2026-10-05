# dsh-turn-cost

English | [中文](README.zh-CN.md)

Shows what each answer cost, in the footer of that answer.

```
… answer …

        Cost ¥0.0066   [ turn usage 51.9K tok ]   14:32
        ↑ this plugin           ↑ built into Harness
```

Hover the amount for the turn's four token buckets, the input/output split, the model that actually ran, the price tier in force, where the turn sits against the session median, the cache hit rate, and a per-step breakdown.

## What it shows

The amount is the turn's token usage converted at DeepSeek's published rates:

```
cost = cache-hit input × hit price
     + (uncached input + cache write) × miss price
     + output × output price
```

The counts come from **the usage the provider itself reports** in the turn's session events — `usage` on the `assistant/message` event, or the last `usage` chunk in the settlement stream. They are not a character-count estimate. The model name comes from the message's own route, so switching models needs no configuration.

### Price table

Built in for `deepseek-flash` and `deepseek-v4-pro`, in CNY per million tokens:

| Model | Window | Cache hit | Cache miss | Output |
|---|---|---|---|---|
| deepseek-flash | Off-peak | 0.02 | 1 | 4 |
| deepseek-flash | Peak | 0.04 | 2 | 8 |
| deepseek-v4-pro | Off-peak | 0.15 | 4.5 | 13.5 |
| deepseek-v4-pro | Peak | 0.30 | 9 | 27 |

Source: <https://api-docs.deepseek.com/quick_start/pricing/>. When prices change, edit the `PRICING` constant at the top of `lib/client.js`.

DeepSeek's input price has only two tiers — cache hit and cache miss — and cache writes are billed at the miss price, so `cacheMiss` covers both uncached input and cache writes.

**Peak hours** are Beijing time, Monday to Friday, 09:00–12:00 and 14:00–18:00; everything else (including all weekend) is off-peak. Chinese public holidays can't be determined offline, so the plugin tests weekday and hour only. Hours inside a public holiday are therefore shown at the peak rate — conservative, it never under-counts.

An unrecognised model falls back to `deepseek-flash` peak rates: better to over-estimate than under.

**Turns that cross the peak boundary are priced per step.** If a turn starts off-peak and finishes peak (11:58 → 12:03, say), each step is priced at the rate in force when it ran and the amounts are summed, rather than pricing the whole turn at whatever rate the last message landed in. The hover detail says so explicitly. This is only used when the step breakdown covers exactly the same tokens as the whole-turn fold — retries make the two disagree, and then the plugin falls back to whole-turn pricing rather than guess.

## Click to enlarge

The footer type is small, so **clicking the amount enlarges it** (1.6× and bold); click again to restore.

Enlarging is **global**: click any one and every answer's amount grows, because clicking each of them individually would be useless. The preference is stored in the browser (`localStorage`, key `dsh-turn-cost.enlarged.v1`) and survives reloads.

Keyboard works too: the amount is focusable, and Enter or Space toggles it. The tooltip says which way the click will go.

## The "so expensive" danmaku

Cross **¥1** in a single turn and a full-screen barrage flies across the window, right to left, with staggered rows, sizes, durations and colours. The count **scales with the amount**: `¥1 → 24`, `¥4 → 48` (capped).

| Behaviour | Why |
|---|---|
| Only fires for a newly completed turn over the threshold | The first time you open a session it only registers the history, otherwise you'd be buried under dozens of danmaku on page load |
| Different copy for a new record | "New record! ¥4.00"; the existing high score is never reported as a new one |
| 30-second cooldown | Several expensive turns in a row won't machine-gun the screen; budget alerts ignore the cooldown |
| A chime | Two short tones synthesised with `AudioContext`, no audio files; stays silent if it fails |
| The whole layer is `pointer-events: none` | However dense it gets, it never blocks a click (the overlay's direct children default to clickable, which is explicitly overridden here) |
| Hidden from screen readers | `aria-hidden="true"`; and nothing plays at all under `prefers-reduced-motion` |

It renders into `shell.overlay` — the root-scope layer Harness reserves for full-screen overlays — which is why it can genuinely fill the screen. The trade-off is that it sits *under* modals (the overlay layer is z-index 20, modals are 1000+); that ordering is fixed by the slot system.

Knobs live at the top of `lib/client.js`: `DANMAKU_COST` (threshold), `DANMAKU_MIN` / `DANMAKU_MAX` (count range), `DANMAKU_COOLDOWN_MS` (cooldown), `DANMAKU_SOUND` (chime on/off).

## The line under the composer

The summary gets **its own row, below Harness's own stats pills**, and one type step smaller than that row (both are based on Harness's `--dsh-content-font-size-secondary`, so changing the content font size in settings scales both — this line stays 2px smaller):

```
        [stats pills]  [context meter]

This session ¥3.40 (6 turns) · Today ¥3.40 · Last 7 days ¥12.40 · cache hit 99.7%
  · context 243.0k · next turn est. ¥0.14~1.02 · about 35 turns left
```

Click the line to cycle the daily budget.

**How it gets its own row**: that dock is a non-wrapping horizontal flex container (`gap: 12px`, `justify-content: center`), so the plugin injects one rule to let the container wrap, and its own item uses `flex: 0 0 100%` + `order: 1` to land on the next row:

```css
[class*="_dock"]:has([data-turn-cost-summary]) { flex-wrap: wrap }
```

The selector doesn't depend on a hashed class name: `[class*="_dock"]` uses the stable CSS Module suffix `_dock`, and `:has(...)` narrows it to the one containing the summary.

**Type size**: `calc(var(--dsh-content-font-size-secondary, 13px) - 2px)`, with the line height reduced by the same 2px. Want it smaller still? Change the single `SUMMARY_FONT_STEP` constant in `lib/client.js`.

| Segment | Meaning |
|---|---|
| This session / Today / Last 7 days | amount and turn count; today and the last 7 days come from the browser-local ledger |
| cache hit | cache reads ÷ all input tokens, across the session. A hit costs 50× less than a miss, so when this drops, money is leaking |
| context | from the `contextPressure` projection — what the next request has to walk through again |
| next turn est. | a range built from the cheapest and dearest already-priced turns in this session, not a guess |
| about N turns left | account balance ÷ this session's average cost per turn (the segment is omitted when the balance can't be read) |

## Daily budget

Click the line to cycle: `off → ¥5 → ¥10 → ¥20 → ¥50 → ¥100 → off`, stored in the browser.

- At **80%** the line turns amber (the theme's warn colour); **over budget** it turns red and says so.
- The first time you go over on a given day, a danmaku barrage fires (ignoring the 30-second cooldown). Once per day.
- With no tier selected you just get `Today ¥X`, with no ratio and no colour.

> Why cycle tiers instead of a text field: Electron has no `window.prompt`, and building a settings
> page for this one number isn't worth it. For an exact figure, edit `BUDGET_STEPS`.

## Cost tiers

Expensive turns change colour, using Harness's theme-aware semantic colours so light and dark both work:

| Tier | Trigger | Rendering |
|---|---|---|
| Normal | default | inherits the parent colour, no decoration |
| Warn | this turn ≥ ¥0.50, **or** ≥ 3× the session median | `--dsw-alias-state-warn-primary` |
| Alert | this turn ≥ ¥3.00, **or** the warn tier bumped once more by the relative rule | `--dsw-alias-state-error-primary`, plus bold |

**Why two signals rather than one threshold**: a single amount threshold is unusable here — a coding turn with dozens of tool calls and a two-line chat turn differ by orders of magnitude, so no one number means anything in both cases. So:

- **absolute** answers "is this turn genuinely expensive?", comparable across sessions;
- **relative** (≥ 3× the session median) answers "is this much more than I usually spend?", adapting to how you actually work.

The relative rule needs at least 4 samples before it applies, so a fresh session never compares you against yourself. When neither signal fires, nothing is coloured — no rainbow. And the alert tier also goes bold, so colour is never the only carrier of meaning.

### How the thresholds were chosen

They were calibrated against **real usage**, not guessed: on the machine this was written on, a long session's turns ran **¥0.15 – ¥1.02** each (context around 250k tokens, cache hit rate above 98%). A threshold set too low turns every turn red and the colour stops carrying information, so the conservative ¥0.50 / ¥3.00 was chosen — reaching it means the turn actually cost money.

All four constants sit at the top of `lib/client.js` (`WARN_COST` / `ALERT_COST` / `OUTLIER_RATIO` / `OUTLIER_MIN_TURNS`). Retune them to your own usage.

## Cache hit warning

A cache-miss input token costs **50×** a cache hit (¥1 vs ¥0.02 off-peak on flash), and an expensive turn is usually not one with a long answer — it's one whose context missed the cache. So when the hit rate is low *and* the money that wasted is material (default ≥ ¥0.02), the amount gains a `↓12%` marker, and the tooltip spells out how much those misses cost versus a full hit.

When the hit rate is healthy there is no marker at all — real sessions sit above 98%, so this only appears when something is actually wrong.

## Per-step breakdown

The hover detail lists each step **dearest first**: `Step 2 ¥0.0520 · read`, `Step 1 ¥0.0014 · pwsh ×2`. Up to 5 steps; the rest collapse into one line.

That answers "where did the money go" directly: a step that stands out is usually the one that grew the context, or a tool that returned something huge and forced a full re-read afterwards.

> Each step's amount comes from the usage the model reported for that step's requests. The strict
> whole-turn fold also accounts for retries, so the step amounts can differ slightly from the turn
> total. That is expected.

## Spend-history panel

The sidebar gains a bar-chart icon (after Harness's own Plugins and Schedules); it opens a full page in the centre column:

```
Cost history                          Estimated from token prices, not a bill   [Export CSV] [Refresh]

Today ¥3.40 · last 7 days ¥12.40 · all time ¥47.20

By day            Date              Turns   Amount
                  2026-10-06            6    ¥3.40
                  2026-10-05           14    ¥7.10
                  …

By session (top 20)  Session        Turns   Amount
                  c80faa41              6    ¥3.40
                  …
```

The export is a BOM-prefixed CSV (opens cleanly in Excel), with a date/amount/turns section and a session/amount/turns section.

Implementation notes, all constraints discovered the hard way:

- `main` is a **keyed** slot, so registration uses `key`; `sidebar.panellist` is a **list** slot, so it uses `id` — and **the two must be the same string**, otherwise clicking the icon throws `layout.selectPanel: main panel "x" is not registered`.
- The panel id is `turn-cost-history`, avoiding the reserved `conversation` and the shipped `plugins` / `schedules` (a duplicate at the same priority throws).
- **The registered component *is* the glyph** — the sidebar provides no fallback icon, so not drawing one leaves an empty 36×36 button. This one is an inline SVG bar chart, with no dependency on any UI package.
- `main` is **root scope**: no `sessionId`, no `useChat`. The panel doesn't need them — it only reads the local ledger.
- The layout gives you **no padding and no scroll container**, so the page's root element owns `height: 100%` and its own `overflow: auto`.
- Switching away and back **remounts** the page (local state is lost), which is why the data is re-read from the ledger on every render instead of held in component state.

## The ledger

Today and the last 7 days are recorded in the browser (`localStorage`, key `dsh-turn-cost.ledger.v1`) and survive across sessions and reloads. Turns are de-duplicated by `<sessionId>:<messageId>`, and if a turn's cost changes (a retry), the old value is subtracted before the new one is added — it never accumulates twice. The ledger keeps 60 days and prunes itself.

When local storage is unavailable (private mode, say), it degrades to accumulating within the current session only; nothing else breaks.

## Amount formatting

- One yuan and up: two decimals — `¥1.23`
- Under one yuan: four decimals, at least two — `¥0.0066`, `¥0.50`
- Under `¥0.0001`: `<¥0.0001`

## Placement and attribution rules

It registers into `conversation.chat.assistant-actions` (a `list` slot declared by `ui-chat`, session scope) — the same footer row where Harness puts its own turn-usage pill and the clock.

A turn can contain several steps (tool round-trips) and each step has an assistant message, but the conversation footer only hangs off the **closing** one. The plugin likewise attributes the whole turn's cost to the turn's last assistant message with an id; intermediate steps show no amount, so nothing is billed twice.

If the turn's event window is incomplete — history truncated, turn still running — the plugin shows nothing rather than a wrong number. `deriveTurnTokenUsage` is strict about this by design: any missing lifecycle boundary, incomplete usage or self-contradictory total makes the whole turn unavailable.

## Where the data comes from

The plugin only reads the event window the client already has. No extra network requests:

```js
ctx.sessions.binding(sessionId).eventSource   // { getSnapshot(), subscribe() }
```

`eventSource` is the client Session's observable "contiguous history plus live tail" window. Handed to the slot as a bare `hooks` source, the framework binds it into a `useEvents` selector hook. The plugin then slices events by `turn/start … turn/end`, folds the usage, and matches it up by `event.data.message.id` — the `messageId` the slot supplies.

**Why the fold is inlined**: `deriveTurnTokenUsage` comes from `@deepseek-ai/dsh-token-meter`. That package does export a browser-safe `./client` entry, but it declares no `dsh.client`, so it is not a row in the boot graph and a plugin's browser half cannot `require` it. `lib/client.js` therefore carries a verbatim port of the 0.2.0-rc.2 implementation; the two must stay in step.

## Files

| File | Role |
|---|---|
| `package.json` | declares `dsh.bundle` (a patch layer) and `dsh.client` (a browser half) |
| `cordis.patch.yml` | inserts one `turn-cost` row into the Host Loader |
| `lib/index.js` | host half: an empty `apply`, present only so the browser module system finds the package |
| `lib/client.js` | browser half: price table, usage fold, footer amount, summary, danmaku, history panel |
| `tests/client.test.mjs` | 126 stub-React checks: module wrapper, all five slot registrations, event folding, peak-boundary pricing, tiers, cache marker, step breakdown, budget, ledger de-duplication, click-to-enlarge, danmaku, history panel |
| `tests/pricing.test.mjs` | 15 checks on the price model and amount formatting |

Run the tests (no dependencies, Node 18+; the Node bundled with DSH works too):

```bash
node tests/pricing.test.mjs
node tests/client.test.mjs
```

## Known limitations

- **These are estimates from token prices, not a bill.** The platform meters and charges on its own terms; peak/off-peak boundaries, public holidays and price changes can all make these numbers differ from what you are actually charged. For the real figure, watch the balance in **Settings → Account** (or pair this with `dsh-balance-badge`).
- **Only settled turns are priced** — a running turn shows nothing until it finishes.
- **Messages outside the loaded event window** have no amount.
- Whether a public holiday should be priced as off-peak or peak, the plugin can only guess from weekday and hour (conservatively).

## Install / remove

```powershell
# install (<repo> is the absolute path you cloned into)
dsh plugin --profile desktop add "<repo>\packages\dsh-turn-cost"

# remove
dsh plugin --profile desktop remove dsh-turn-cost
```

This directory installs into `~/.dsh/profiles/desktop` as a `link:`, so **moving it breaks the plugin**.

After installing or removing, let Harness recompose: restart the app, or toggle this plugin once on the in-app **Plugins** page. (A running app does not reliably reload when profile files change from outside — in practice, sometimes it does and sometimes it doesn't.)
