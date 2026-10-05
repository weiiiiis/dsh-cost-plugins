# dsh-balance-badge

English | [中文](README.zh-CN.md)

A client plugin for DeepSeek Harness that keeps your DeepSeek account balance permanently visible at the foot of the left sidebar, just above **Settings**.

```
Balance   ¥123.45
```

Hover for the topped-up and granted amounts broken out; click to refresh immediately.

## What it shows

| State | Display |
|---|---|
| Loaded | the topped-up balance; granted credit is listed separately in the hover detail when there is any |
| Signed out | `Not signed in` |
| Query failed | `Balance unavailable` |
| Loading | `Checking…` |

Amounts use the same formatting as the DeepSeek platform web UI: two decimals, thousands separators, positive amounts truncated to cents, and positive sub-cent amounts shown as `<0.01`.

When it refreshes: once on mount, then every 60 seconds, whenever the window regains focus, and on every click.

## Where the number comes from

The balance belongs to your DeepSeek **platform account** — the account you signed in with inside Harness — not to an API key. The plugin calls the account Remote that Harness already exposes:

```js
ctx.remote.account.getBalance({ version, locale, timezoneOffsetSeconds })
// => { ok: true, value: null | { status: 'ready', value: [...], bonusWallets: [...] } | { status: 'failed' } }
```

So it shows exactly the same figure as **Settings → Account**, and both prompt you to sign in when you are not. If this badge reads `Not signed in`, sign in once from that settings page.

## Where it sits

It registers into the `sidebar.footer.action` list slot (declared by `ui-sidebar`, kind `list`, scope `root`) — the seat Harness reserves for optional actions beside Settings.

One caveat: on Windows desktop, collapsing the sidebar to the icon rail hides the whole foot area (`[data-windows-titlebar] .collapsed .footArea { display: none }`), which takes the Settings entry with it. The badge behaves the same way. Expand the sidebar and it is back.

## Files

| File | Role |
|---|---|
| `package.json` | declares `dsh.bundle` (a patch layer) and `dsh.client` (a browser half) |
| `cordis.patch.yml` | inserts one `balance-badge` row into the Host Loader |
| `lib/index.js` | host half: an empty `apply`, present only so the browser module system finds the package |
| `lib/client.js` | browser half: the UI itself, wrapped in `window.__ModuleLoader__.load({ id, factory })` |
| `tests/client.test.mjs` | 19 unit checks against a stub React: module wrapper, registration, all four render states |
| `../../docs/` | reference notes on the DSH plugin and slot systems, at the repository root |

Run the tests (no dependencies, Node 18+; the Node bundled with DSH works too):

```bash
node tests/client.test.mjs
```

`lib/client.js` is hand-written rather than a build artifact, so there is no `lib/types/*.d.ts` and no source map.

## Install / remove

Install (already done on the machine this was developed on; kept here for reference):

```powershell
dsh plugin --profile desktop add "<repo>\packages\dsh-balance-badge"
```

That adds this directory to `~/.dsh/profiles/desktop` as a `link:` dependency and appends `dsh-balance-badge` to `dsh.profile.bundles`. Because it is a symlink, **moving this directory breaks the plugin**.

Remove:

```powershell
dsh plugin --profile desktop remove dsh-balance-badge
```

After installing or removing, let Harness recompose: restart the app, or toggle this plugin once on the in-app **Plugins** page. A running app does not reload when profile files are changed from outside.
