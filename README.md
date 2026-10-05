# DSH Cost Plugins

English | [中文](README.zh-CN.md)

Two client plugins for [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/) that put the money where you can actually see it: your account balance in the sidebar, and what each answer really cost.

Agentic sessions burn tokens quietly. A long coding turn can cost a hundred times a short chat turn, and nothing in the UI tells you which is which — until the balance is gone. These two plugins fix that.

| Plugin | What it does |
|---|---|
| [`dsh-balance-badge`](packages/dsh-balance-badge) | Always-visible DeepSeek account balance (topped-up + granted) at the foot of the sidebar; click to refresh |
| [`dsh-turn-cost`](packages/dsh-turn-cost) | Per-answer cost: footer amount with cost tiers, cache-hit warnings, per-step breakdown, session/today totals, a daily budget, a "so expensive" danmaku barrage, and a spend-history panel |

They are independent — install either one.

## What it looks like

`dsh-turn-cost` adds an amount to each answer's footer, right next to Harness's own turn-usage pill:

```
… answer …

        Cost ¥1.02   [ turn usage 51.9K tok ]   14:32
```

Hover for the full breakdown: the four token buckets, input vs output money, the actual model and price tier, where this turn sits against the session median, the cache hit rate, and **cost by step, dearest first** (`Step 2 ¥0.0520 · read`).

Below the composer, on its own line and one step smaller than Harness's stats row:

```
This session ¥3.40 (6 turns) · Today ¥3.40 · Last 7 days ¥12.40 · cache hit 99.7%
  · context 243.0k · next turn est. ¥0.14~1.02 · about 35 turns left
```

Cross ¥1 in a single turn and a full-screen danmaku barrage flies across the window — more expensive turns get more of it, a new personal record gets its own copy, and a 30-second cooldown keeps it from becoming wallpaper.

The sidebar also gains a bar-chart icon that opens a spend-history page: by day and by session, with CSV export.

## Why you can trust the numbers

- Cost is computed from the **usage the provider itself reports** in the session log — not from a character-count estimate.
- Input and output are priced separately, with the cache-hit / cache-miss split that dominates real bills (a miss costs 50× a hit at off-peak `deepseek-flash` rates).
- A turn that crosses the peak/off-peak boundary is priced **per step**, not smeared across whichever rate the last message happened to land in.
- Incomplete evidence — a truncated event window, a turn still running, retries that don't reconcile — renders **nothing** instead of a wrong number.
- Colour is never the only signal: the alert tier also goes bold, and every state carries a full `aria-label`.

## Requirements

- DeepSeek Harness Desktop (developed and verified on `0.2.0-rc.2`)
- Sign in to a DeepSeek account inside Harness for the balance badge and the "turns left" figure (Settings → Account). The balance comes from the platform account, not from an API key.

## Install

The plugins install into a DSH profile as `link:` dependencies, so **clone somewhere you won't move it afterwards**:

```powershell
git clone https://github.com/weiiiiis/dsh-cost-plugins.git "$env:USERPROFILE\dsh-cost-plugins"
```

Then add them one at a time (`<repo>` is the absolute path you just cloned into):

```powershell
dsh plugin --profile desktop add "<repo>\packages\dsh-turn-cost"
dsh plugin --profile desktop add "<repo>\packages\dsh-balance-badge"
```

Let Harness recompose afterwards: restart the app, or toggle each plugin once on the in-app **Plugins** page. A running app usually picks the change up on its own within seconds.

Remove:

```powershell
dsh plugin --profile desktop remove dsh-turn-cost
dsh plugin --profile desktop remove dsh-balance-badge
```

> The `desktop` profile is owned exclusively by the desktop application, so you must use the `dsh` launcher that the desktop install provides — an npm-installed CLI refuses to touch that profile. And because the install is a symlink, **do not move the repo directory** once installed.

## Repository layout

```
packages/
  dsh-balance-badge/     sidebar balance badge
    package.json         declares dsh.bundle (a patch layer) and dsh.client (a browser half)
    cordis.patch.yml     inserts one row into the Host Loader
    lib/index.js         host half: empty apply, it only exists so the browser module system finds the package
    lib/client.js        browser half: the actual UI (hand-written, not a build artifact)
    tests/               unit tests against a stub React
  dsh-turn-cost/         per-answer cost
    (same shape, plus a pricing-model test suite)
docs/                    reference notes on the DSH plugin and slot systems
```

## Tests

No dependencies to install — run them with plain Node (18+):

```bash
node packages/dsh-turn-cost/tests/pricing.test.mjs
node packages/dsh-turn-cost/tests/client.test.mjs
node packages/dsh-balance-badge/tests/client.test.mjs
```

The three files cover price arithmetic, the full `dsh-turn-cost` client (126 checks) and the `dsh-balance-badge` rendering (19 checks). CI runs the same three on every push.

## How it works

A DSH plugin is an ordinary npm package that:

1. declares a patch layer with `dsh.bundle.patch` and a browser half with `dsh.client.platform: "web"`;
2. uses that patch layer to insert one row into the Host Loader;
3. exports `apply(ctx)` / `inject` from the browser half.

The UI hangs off **slots** that Harness already declares. These plugins use:

| Slot | Used for |
|---|---|
| `sidebar.footer.action` | the balance badge |
| `conversation.chat.assistant-actions` | the per-answer cost pill |
| `conversation.composer.dock` | the summary line under the composer |
| `shell.overlay` | the full-screen danmaku layer |
| `main` + `sidebar.panellist` | the spend-history page and its sidebar icon |

Everything is derived from data the client already has — no extra network requests except the balance read. Cost is folded from the `usage` the model reports in the turn's session events; the balance comes from Harness's own `ctx.remote.account.getBalance()`.

## Known limitations

- **The amounts are estimates from token prices, not a bill.** The platform meters and charges on its own terms; peak/off-peak boundaries, public holidays and price changes can all make these numbers differ from what you are actually charged. Prices live in a `PRICING` constant at the top of each plugin's `lib/client.js` — edit it when they change.
- Chinese public holidays can't be determined offline, so the peak/off-peak test uses weekday and hour only. Hours inside a public holiday are shown at the peak rate (conservative — it never under-counts).
- Only **settled** turns are priced. A turn that is still running shows nothing until it finishes.
- Messages outside the loaded event window have no amount.
- The reasoning-token bucket isn't available from the current adapter (not once in several hundred real messages), so that line is usually absent.
- DSH slot names and event shapes may change between releases. These plugins were written against `0.2.0-rc.2`.

## License

[MIT](LICENSE)
