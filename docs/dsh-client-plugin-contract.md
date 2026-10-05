# DSH client-side UI plugin bundle — verified authoring contract

Investigated: 2026 (this session), Windows. All paths below are relative to the extraction root
`<scratch>/ex\`, where `@deepseek-ai/<pkg>` was copied out of
`D:\deepseek\resources\app.asar\dsh\node_modules\@deepseek-ai\<pkg>` into
`dsh__node_modules__@deepseek-ai__<pkg>\`.

Installed runtime: **DSH `0.2.0-rc.2`** (`dsh__node_modules__@deepseek-ai__dsh\package.json:4`),
Harness home `C:\Users\<user>\.dsh` (default `~/.dsh`, `dsh-home-paths/README.md:22-32`),
Electron-owned profile `~/.dsh/profiles/desktop` (verified on disk).

Legend: **[V]** = read directly from shipped code/README in this session. **[I]** = inferred from
verified code paths, not stated verbatim anywhere.

---

## 0. The single most important fact

A browser-side UI plugin is **not** a separate artifact kind. It is an ordinary Cordis plugin
package that additionally declares `dsh.client` in its `package.json` and ships a `./client` export
bundle. The host-side Loader mounts the package like any other plugin row; `dsh-client-modules`
scans the *same* Loader entries, finds the `dsh.client` declaration, and serves each `client.js`
into the page; the page then mounts the **module's own exports as a second Cordis plugin**.

> `dsh-client-modules/README.md:12` — "turns a plugin package's `dsh.client` declaration into a
> loadable browser bundle: the host half scans enabled Loader entries and composes the boot graph,
> an available Web carrier serves each bundle over `/plugins`"

> `dsh-client-ui-goal/lib/index.js:2-9` (complete host half of a pure UI plugin):
> ```js
> /**
> * Goal surface plugin, node half. Pure UI plugin: the empty apply exists so
> * the plugin appears in the host cordis.yml / Loader; the browser half
> * ships via exports["./client"], discovered through the package.json
> * dsh.client declaration.
> */
> /** Host plugin body — no host-side behavior for this surface plugin. */
> function apply() {}
> export { apply };
> ```

---

## 1. Bundle layout

### 1.1 Minimal directory/file layout (verified against 5 shipped packages)

```
my-dsh-ui-plugin/
  package.json          <- required: name, version, type, main, exports, dsh.client, dsh.bundle
  cordis.patch.yml      <- required for a profile BUNDLE (the install unit); declares the row(s)
  lib/index.js          <- host half (ESM). May be an empty `export function apply(){}`
  lib/client.js         <- browser half, MUST be the __ModuleLoader__ factory wrapper (see §4.1)
  lib/types/**/*.d.ts   <- optional; referenced by `exports.*.types`, NOT present in the shipped asar
  README.md / LICENSE   <- optional
```

Evidence — the shipped layout of `@deepseek-ai/dsh-client-ui-goal` (7 files):
`lib/index.js` (404 B), `lib/client.js` (25953 B), `package.json`, `README.md`, `README.zh.md`,
`README.i18n.yaml`, `LICENSE` (`tmp\ex` listing). Same shape for
`dsh-client-ui-brand-official` (`lib/index.js` 318 B, `lib/client.js` 1863 B),
`dsh-client-ui-layout` (180 B / 31732 B), `dsh-client-ui-jobs` (379 B / 31733 B),
`dsh-client-ui-settings-account` (2974 B / 5279763 B).

Note: `lib/types/**/*.d.ts` is listed in every package's `files` array but is **stripped from this
packaged asar** — only `lib/types/*.js` remain. Type-only files are a build artifact concern, not a
runtime one.

### 1.2 Is the bundle wrapper required, or is a path enough?

Both, at different layers. Two distinct "units" exist:

| Unit | Declared by | Meaning |
|---|---|---|
| **Plugin row** | `cordis.patch.yml` `insert:` entry | one Loader entry = one mounted plugin |
| **Bundle** | `package.json` → `dsh.bundle.patch` | a *layer of patch rows* the profile composes |

`dsh.profile.bundles` (in the **profile's** `package.json`, not the plugin's) is the ordered list of
bundles. Verified live on this machine —
`C:\Users\<user>\.dsh\profiles\desktop\package.json`:
```json
{
  "name": "dsh-profile-desktop",
  "private": true,
  "dependencies": {},
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"] } }
}
```

A plugin package that is only a **row** (not a bundle) is added to the profile's `cordis.patch.yml`
by hand or by its own bundle. A plugin package that is a **bundle** declares
`dsh.bundle.patch` and gets added to `dsh.profile.bundles`.

> `dsh-app-boot/README.md:50` **[V]** — "A bundle's `dsh.bundle.patch` names one patch file or an
> ordered list of files; `bundlePatchFiles` validates the declaration and `bundlePatchPaths`
> resolves it to absolute paths; the layer concatenates their patch lists in that order."

> `dsh-app-boot/lib/index.js:495-509` **[V]** — `bundlePatchFiles` accepts a string or an array of
> strings and throws `"dsh.bundle.patch must be a file path or a list of file paths"` otherwise;
> `bundlePatchPaths(packageDir, bundle)` joins each onto the package dir.

> `dsh-plugin-manager/lib/index.js:250-255` **[V]** — on install, a new dependency **without**
> `dsh.bundle` gets `dsh: warning: <name> declares no dsh.bundle — installed as a plain dependency,
> not a profile layer` and is **not** appended to `dsh.profile.bundles`; one **with**
> `dsh.bundle` is appended (`bundles.push(name)`).

---

## 2. `package.json` fields

### 2.1 The `dsh` field on a client UI plugin

Quoted verbatim from `dsh-client-ui-goal/package.json:28-41`:

```json
  "dsh": {
    "client": {
      "inject": [
        "@deepseek-ai/dsh-api-remotes",
        "@deepseek-ai/dsh-api-session-controller",
        "@deepseek-ai/dsh-client-locale",
        "@deepseek-ai/dsh-client-ui-chat",
        "@deepseek-ai/dsh-client-ui-conversation",
        "@deepseek-ai/dsh-client-ui-renderer",
        "@deepseek-ai/dsh-client-ui-session"
      ],
      "platform": "web"
    }
  },
```

`dsh.client` is validated by `dsh-client-modules/lib/index.js:61-75` **[V]** — the exact accepted
members and the exact error strings:

| member | type | required | validator line |
|---|---|---|---|
| `platform` | string (`"web"` is the only value the host accepts) | **yes** | `:65`, `:714` |
| `inject` | string[] | no | `:66` |
| `external` | string[] | no | `:67` |
| `immediately` | boolean | no | `:68` |

```js
// dsh-client-modules/lib/index.js:61-75
function parseDshClient(pkgName, value) {
	if (value === void 0) return void 0;
	if (typeof value !== "object" || value === null) throw new Error(`client-modules: ${pkgName} has a non-object dsh.client declaration`);
	const decl = value;
	if (typeof decl.platform !== "string") throw new Error(`client-modules: ${pkgName} dsh.client.platform must be a string`);
	const inject = optionalStringArray(pkgName, "dsh.client.inject", decl.inject);
	const external = optionalStringArray(pkgName, "dsh.client.external", decl.external);
	if (decl.immediately !== void 0 && typeof decl.immediately !== "boolean") throw new Error(`client-modules: ${pkgName} dsh.client.immediately must be a boolean`);
	return { platform: decl.platform, ... };
}
```

and the gate at `:713-719` **[V]**:
```js
const decl = parseDshClient(packageName, dsh !== null && typeof dsh === "object" ? dsh.client : void 0);
if (decl === void 0 || decl.platform !== "web") { this.pkgMeta.set(sourceKey, null); return null; }
const clientRel = clientExportOf(packageName, pkg.exports);
if (clientRel === void 0) throw new Error(`client-modules: ${packageName} declares dsh.client but exports no "./client" bundle`);
```

**`dsh.client.inject` is NOT service injection.** It is a *module-graph* dependency list
(`dsh-client-modules/README.md:34` **[V]**: "lists any non-baseline module requests under
`dsh.client.external`" — the injection list orders the boot graph so providers load before
consumers). Service injection is the *module's own exported `inject`* — see §4.

`dsh.client.external` — an exact non-baseline module request; the resolving supplier is either the
dynamic package row it names, or an exact key of the shell's static table
(`dsh-client-modules/README.md:46` **[V]**). Self-requests and sync cycles are rejected
(`lib/index.js:426-430` **[V]**).

### 2.2 `exports["./client"]` — the exact accepted forms

`dsh-client-modules/lib/index.js:171-181` **[V]**:
```js
function clientExportOf(pkgName, exportsField) {
	if (typeof exportsField !== "object" || exportsField === null) return void 0;
	const client = exportsField["./client"];
	if (client === void 0) return void 0;
	if (typeof client === "string") return client;
	if (typeof client === "object" && client !== null) {
		const fallback = client.default;
		if (typeof fallback === "string") return fallback;
	}
	throw new Error(`client-modules: ${pkgName} exports["./client"] must be a string or an object with a string default`);
}
```

Shipped form (`dsh-client-ui-goal/package.json:16-27`) **[V]**:
```json
  "exports": {
    ".": { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
    "./client": { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" },
    "./src/*": "./src/*",
    "./package.json": "./package.json"
  },
```

`lib/client.js` must exist on disk at serve time; a missing bundle throws a structured
`MissingClientBundleError` telling you to `run \`pnpm run build\` before launch`
(`dsh-client-modules/lib/index.js:128-141` **[V]**).

### 2.3 Version constraints — this is a launch gate

> `dsh-app-boot/README.md:52` **[V]** — "Before a profile imports a plugin, DSH checks its
> `peerDependencies` on `@deepseek-ai/dsh` and `@deepseek-ai/dsh-*` against the single runtime
> version returned by `getDshRuntimeVersion()`. Every declared range must match; prereleases
> participate in range matching. … Missing DSH peers impose no constraint; invalid ranges are
> incompatible. These checks use peer declarations, not `engines.dsh`."

Implementation — `dsh-app-boot/lib/index.js:286-301` **[V]**:
```js
for (const [name, range] of Object.entries(dependencies)) {
	if (name !== "@deepseek-ai/dsh" && !name.startsWith("@deepseek-ai/dsh-")) continue;
	const requirement = ["workspace:^","workspace:~","workspace:*"].includes(range) ? runtimeVersion : range;
	if (requirement.trim() === "" || !semver.satisfies(runtimeVersion, requirement, { includePrerelease: true })) peers[name] = range;
}
```

And a bundle that fails is **skipped, not fatal** (`README.md:50` **[V]**: "Bundle resolution,
manifest, and patch-loading failures skip that bundle without changing its selection").

Practical consequence **[I]**: for this installation, either declare no `@deepseek-ai/dsh*` peers at
all, or declare exactly `"0.2.0-rc.2"` (or `"workspace:*"` in a workspace build). A wildcard that
fails the prerelease range (e.g. `"^0.1.0"`) makes the whole bundle silently disappear from the
composition.

Shipped packages are conservative here — client UI packages declare **only**:
```json
  "peerDependencies": { "@deepseek-ai/cordis": "~4.0.4" }
```
(`dsh-client-ui-goal/package.json:43-45`, `dsh-client-ui-brand-official/package.json:38-40`,
`dsh-client-ui-layout/package.json:41-43` **[V]**). `@deepseek-ai/cordis` is *not* matched by the
gate above, so this is a safe, unconstrained declaration.

`dsh.manifestVersion` and `engines.dsh` exist but are **not enforced**:

> `dsh-package-manifest/README.md:52-53` **[V]** — "`dsh.manifestVersion` | Manifest format
> identifier; the declared format is `1`" … "`engines.dsh` | Author-declared compatible DSH versions
> as a SemVer range" … `:93` "Current installers and loaders do not enforce `dsh.manifestVersion` or
> `engines.dsh`".

The documented canonical shape (`dsh-package-manifest/README.md:30-44` **[V]**):
```ts
const manifest: DshPackageManifest = {
  name: 'example-dsh-plugin',
  version: '1.0.0',
  engines: { node: '>=24', dsh: '0.1.5-alpha.1' },
  dsh: {
    manifestVersion: 1,
    bundle: { patch: './cordis.patch.yml' },
    client,
  },
}
```

### 2.4 Bundle declaration, from a real bundle

`dsh-base/package.json:31-35` **[V]** (single patch file):
```json
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
```

`dsh-web-app/package.json:41-51` **[V]** (ordered list — all mode presets ship in one bundle):
```json
  "dsh": {
    "bundle": {
      "patch": [
        "./cordis.patch.yml",
        "./presets/standard.patch.yml",
        "./presets/ptc.patch.yml",
        "./presets/minimal.patch.yml",
        "./presets/cordis.patch.yml"
      ]
    }
  },
```

**A dual bundle that ships both a browser roster and host rows therefore needs both keys:**
```json
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },
  "client": { "platform": "web" }
}
```
**[I]** — no shipped package carries both in one manifest (the `dsh-web-app` bundle has no
`dsh.client`; the `dsh-client-ui-*` packages have `dsh.client` but no `dsh.bundle`). The two fields
are read by independent code paths (`bundlePatchPaths` vs `parseDshClient`), so combining them is
sound but unverified end-to-end here.

---

## 3. `cordis.patch.yml` row schema

### 3.1 The patch document

A patch file is a **top-level YAML array of entries**. Each entry is either:

* an **override** — `id:` (+ optional `name:` assertion) + `config:` / `disabled:`, or
* an **insert** — `- insert: [ <row>, <row>, ... ]`.

Real header, `dsh-base/cordis.patch.yml:1-14` **[V]**:
```yaml
# The dsh-base bundle patch: the shared core of each base-backed profile, applied as
# ONE insert over the empty profile root. Later bundle patches and the user's
# profile cordis.patch.yml address these rows by id, with the last write
# winning per row.
#
# A patch replaces the targeted row's whole `config` rather than merging into
# it, so a row whose value differs by mode does NOT live here: it belongs to
# each mode bundle, keeping any single row down to one bundle layer plus the
# user's. Mode-specific rows appear below only with shared plugin identity and
# neutral defaults; each mode bundle restates its complete configuration.
#
# Row order carries no load semantics (activation is service-availability
# driven); the grouping is for readers.

- insert:
    - id: tool-plugin-manager
      name: '@deepseek-ai/dsh-plugin-manager/tools'
      disabled: true
```

### 3.2 Row fields actually observed

| key | example (file:line) |
|---|---|
| `id` | `id: ui-layout` — `dsh-web-app/cordis.patch.yml:248` |
| `name` | `name: '@deepseek-ai/dsh-client-ui-layout'` — `dsh-web-app/cordis.patch.yml:249` |
| `config` | `config: { root: [] }` — `dsh-base/cordis.patch.yml:31-32` |
| `disabled` (literal bool) | `disabled: true` — `dsh-base/cordis.patch.yml:18` |
| `disabled` (`!!js` expr) | `disabled: !!js "!ctx.get('profileContext')"` — `dsh-base/cordis.patch.yml:22` |
| `disabled` (`!!js` expr, profile name) | `disabled: !!js "ctx.get('profileContext')?.name !== 'desktop'"` — `dsh-web-app/cordis.patch.yml:56` |
| `inject` | `inject: [webRuntime]` — `dsh-web-app/cordis.patch.yml:218` |
| `config` with `!!js` value | `trustedHosts: !!js ctx.webRuntime.trustedHosts` — `dsh-web-app/cordis.patch.yml:223` |
| `name` as a builtin | `name: cordis:group` — `dsh-web-app/presets/standard.patch.yml:43` |
| nested children | `- id: agent-preset` … nested `insert:` under a group — `presets/standard.patch.yml:6-150` |

`!!js` accepts **both** a quoted string and a bare expression (`disabled: !!js "!ctx.get(...)"`
vs `trustedHosts: !!js ctx.webRuntime.trustedHosts`).

### 3.3 There is no `client` / `clientEntry` / `browser` field on a row

**Verified negative.** `dsh-web-app/cordis.patch.yml:205-428` declares the entire browser roster —
35 client UI packages — as *plain rows* with only `id` and `name`:

```yaml
    # ── browser plugin roster (dsh.client rows; node halves are layer-2 hosts) ──

    - id: ui-layout
      name: '@deepseek-ai/dsh-client-ui-layout'

    - id: ui-renderer
      name: '@deepseek-ai/dsh-client-ui-renderer'

    - id: ui-session
      name: '@deepseek-ai/dsh-client-ui-session'
    ...
    - id: ui-goal
      name: '@deepseek-ai/dsh-client-ui-goal'
```
(`dsh-web-app/cordis.patch.yml:205-207, 248-255, 376-377`)

The same holds for the one dual-face package, `dsh-client-modules` (`:211-212`):
```yaml
    - id: modules
      name: '@deepseek-ai/dsh-client-modules'
```

**The answer to Q2: the row provides *both* halves implicitly.** `dsh-client-modules` resolves the
browser bundle from the *same* package the row's `name` resolves to. Chromium-side resolution:

1. The row's `name` (`@deepseek-ai/dsh-client-ui-layout`) is resolved through the Loader's own
   resolution (`dsh-client-modules/lib/index.js:743-773` **[V]**, `locatePkgJson`).
2. The nearest ancestor `package.json` declaring that name is located (`:774+`).
3. `pkg.dsh.client` is parsed; `platform` must be `"web"` (`:713-714`).
4. `pkg.exports["./client"].default` (or the string form) gives the bundle path (`:718`, `:171-181`).
5. That file is served at `/plugins/<pkg>/client.js` and pushed into the boot graph as one
   `WebBootEntry` row (`dsh-client-modules/README.md:12`, `:64`; `graphRow()` at `lib/index.js:395-404`).

So the *only* declaration a client plugin needs is `dsh.client` in its own `package.json`. The row
is then a completely ordinary row.

### 3.4 `dsh.client.external` semantics (row-free module sharing)

```jsonc
// dsh-client-ui-goal/package.json — no "external" (everything it needs is a declared provider package or baseline)
// dsh-api-remotes/package.json:33-39
"dsh": { "client": { "inject": ["@deepseek-ai/dsh-api-gateway"], "platform": "web", "immediately": true } }
```

The shell's frozen baseline module table — the only specifiers a bundle may `require` without a
supplier row (`dsh-web-frontend/dist/assets/index-5SrrfWpU.js:126` **[V]**, first lines of the
minified segment):

```js
function rM(){return{
  react:Ef,
  "react/jsx-runtime":If,
  "react-dom":Rf,
  "react-dom/client":Df,
  "@deepseek-ai/cordis":sf,
  "@deepseek-ai/dsh-client-store":lh,
  "@deepseek-ai/dsh-client-ui-slots":hh,
  "@deepseek-ai/dsh-client-ui-primitives":sE,
  "@deepseek-ai/dsh-client-ui-dockkit":XS
}}
```

**Nine baseline specifiers.** Everything else — `@deepseek-ai/dsh-api-remotes`,
`@deepseek-ai/dsh-client-ui-renderer`, `@deepseek-ai/dsh-client-ui-session`,
`@deepseek-ai/dsh-client-locale`, any of your own packages — is a *non-baseline request* and must be
named in `dsh.client.external`, **or** be answered by another dynamic package row it names (which is
the normal case: a UI package `require`s the *package* of a plugin it depends on).

Resolution order (`dsh-client-modules/README.md:68` **[V]**): "Resolution checks the platform seed
table, memoized records, boot-graph rows, and registered factories in that order; anything else
throws." The throw (`lib/client.js:705`) **[V]**:
```
client-modules: require("<spec>") missed the module table — not a platform seed word, not a
materialized module, and no registered package factory (a build-time externals drift, or a dynamic
dependency that did not arrive)
```
`<id>/client` and the bare `<id>` normalize to the same exports — `stripClientSuffix()` at
`lib/index.js:98-100` **[V]**.

---

## 4. Client entry contract

### 4.1 The file wrapper (required, produced by the build)

`lib/client.js` is **not** a plain ESM module. It is a lazy-CJS factory registration against a
`<head>`-injected global facade. Exact wrapper from the smallest shipped example,
`dsh-client-ui-brand-official/lib/client.js:1-7, 42-46` **[V]** (complete, 48 lines):

```js
window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-brand-official",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		/* ...module body... */
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
```

The facade contract is generated by the host (`dsh-client-modules/lib/index.js:453-475` **[V]**):
`window.__ModuleLoader__ = { mode:"queue", pendingQueue, load(registration), create(options) }`; a
registration is `{ id, factory }` (plus optional `chunk`). The bootstrap bundle whose id is
`@deepseek-ai/dsh-client-modules` must be present or `create()` throws
`client-modules: HTML did not preload @deepseek-ai/dsh-client-modules/client.js`.

Execution semantics (`dsh-client-modules/README.md:12, 68` **[V]**): "Plugin bundles execute lazily
— running a bundle only registers a factory, and module side effects run at materialization — so
nothing runs until a plugin is first used." **CSS injection must be inside the factory closure**, and
must tag its `<style>` with `data-plugin` so HMR can retract it — see the real pattern at
`dsh-client-locale/lib/client.js:1028-1035` **[V]**:
```js
const tagId = "@deepseek-ai/dsh-client-locale/LanguageRow.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "@deepseek-ai/dsh-client-locale";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
```

### 4.2 What the module exports

The module's `exports` object is used **directly as the Cordis plugin object**. Verified by the
loader call site: `dsh-client-modules/lib/client.js:353-361` **[V]** `ClientEntries.create(loader,id)`
builds `{ name: id }` and calls `loader.create(options)` — i.e. the Loader imports the graph row by
its package id and mounts whatever that module exports.

Observed export sets across the shipped client plugins (**all verified by grepping the `exports.`
tail of each bundle**):

| package | `apply` | `inject` | `Config` | others |
|---|---|---|---|---|
| `dsh-client-ui-brand-official` | ✓ | ✓ | — | |
| `dsh-client-locale` | ✓ | ✓ | — | `LocaleRuntime`, `COMMON_NS`, `FALLBACK_LOCALE`, `SETTINGS_NS` |
| `dsh-client-ui-layout` | ✓ | ✓ | — | `LayoutController` |
| `dsh-client-ui-goal` | ✓ | ✓ | — | `GoalBar`, `GoalDock` |
| `dsh-client-ui-jobs` | ✓ | ✓ | — | |
| `dsh-client-ui-conversation` | ✓ | ✓ | **✓** | `ConversationController`, `ConversationDefinitionRegistry`, `UiConversation`, `EMPTY_CONVERSATION_SNAPSHOT`, … |
| `dsh-client-ui-plugin-manager` | ✓ | ✓ | — | |
| `dsh-client-ui-renderer` | ✓ | ✓ | — | `SlotRegistry` |
| `dsh-client-modules` | ✓ | ✓ | — | `ClientModuleSystem`, `createClientModuleSystem`, `parseBootManifest`, … |

**No client plugin exports `name`.** Verified negative across all 9 packages above. The Loader
supplies the entry name from the row. **[I]** — exporting `name` is harmless (Cordis prefers it) but
every shipped client plugin relies on the loader-provided name.

**`Config` exists but is not a per-row config contract here.** `dsh-client-ui-conversation`
exports `Config = Schema.object({ maxConcurrentFileUploads: Schema.natural().min(1).default(2) })`
(`lib/client.js:17899` **[V]**), yet its row in `dsh-web-app/cordis.patch.yml:308-309` declares **no
`config:` at all**. The client-side `ctx.configForms` service (injected by
`dsh-client-locale` as `"configForms"`, `lib/client.js:1491-1495` **[V]**, and read at `:1517`
`ctx.configForms.get(LOCALE_SETTINGS_NAMESPACE)`) is the actual client config-form channel. Do not
assume row `config:` reaches the client module.

### 4.3 The `inject` export

Cordis service injection is the module-level exported array — *not* `dsh.client.inject`:

`dsh-client-ui-layout/lib/client.js:566-572` **[V]**:
```js
/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
const inject = [
	"slots",
	"theme",
	"locale",
	"shortcuts"
];
```
Note the comment explicitly says the loader passes the module exports as an object plugin.

Remote namespaces are injected as dotted names — `dsh-client-ui-settings-account/lib/client.js:4181-4190` **[V]**:
```js
/** Services required by account settings. */
const inject = [
	"slots",
	"locale",
	"remote",
	"remote.account",
	"remote.session",
	"theme",
	"configForms"
];
```

Other observed injected service names: `"sessions"`, `"uiSession"`, `"uiWorkspace"`,
`"uiConversation"`, `"jobs"`, `"fileUpload"`, `"configForms"`, `"shortcuts"`,
`"pluginNavigation"`, `"loader"`, `"productAnalytics"` (last via `ctx.get(...)`).

### 4.4 Lifecycle and disposal

Two idioms, both verified in shipped code:

**`ctx.effect(fn, label)` — the primary idiom.** It registers a fiber-owned effect; the returned
value is a disposer, and a returned *function* is invoked on teardown. This is what the slot
registry itself uses.

`dsh-client-ui-layout/lib/client.js:580-584` **[V]**:
```js
ctx.effect(() => ctx.locale.register("shortcuts.layout", { zh, en }), "layout: command labels");
```
`dsh-client-ui-layout/lib/client.js:665-673` **[V]** — an effect returning a composite disposer:
```js
return () => {
	disposeShortcut();
	layout.dispose();
	disposePanels();
	disposeRegistration();
	disposePanelInfo();
	disposeService();
};
```
`dsh-client-ui-goal/lib/client.js:531-534` **[V]**:
```js
ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-goal: dictionaries");
```
`dsh-experimental-client-ui-voice-input/lib/client.js:5764-5766` **[V]** — **async** disposer
supported:
```js
ctx.effect(() => async () => {
	await Promise.all([...recordings].map((recording) => recording.dispose()));
});
```

**`ctx.on(event, fn)` — event subscription, returns its own unsubscribe.** `dsh-client-ui-layout/lib/client.js:677-679` **[V]**:
```js
const off = ctx.on("theme/change", (snapshot) => { presenter.apply(snapshot); });
```
Client-emitted events observed: `"theme/change"`, `"locale/change"`, `"slots/changed"`,
`"connection/reset"` (`dsh-client-ui-goal/lib/client.js:580`).

**`ctx.on('dispose')` was NOT found in any shipped client plugin.** **[V] negative.** Disposal is
`ctx.effect`'s return value. `slots.register` / `slots.inject` / `slots.registerFactory` return
idempotent disposers (see §5); calling one is equivalent to dropping the effect.

**Providing a service:** two spellings observed — `ctx.reflect.provide("layout", layout)`
(`ui-layout:600` **[V]**) and `ctx.provide("locale", locale)` (`client-locale:1526` **[V]**).
`ui-renderer` uses `ctx.reflect.provide("uiRenderer", …)` (`lib/client.js:1844` **[V]**),
`client-modules` uses `ctx.reflect.provide("modules", modules)` (`lib/client.js:868` **[V]**).

**`ctx.get(name)`** reads a service without declaring it — `dsh-client-ui-settings-account/lib/client.js:4465` **[V]**:
```js
track: (name, attributes) => ctx.get("productAnalytics")?.track(name, attributes)
```

### 4.5 React access

React is a **baseline static module** (`react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`
in `PLATFORM_MODULES`) — so `require("react")` needs **no** `dsh.client.external` entry.
`dsh-client-ui-brand-official/lib/client.js:7` **[V]** `let react_jsx_runtime = require("react/jsx-runtime");`
and `dsh-client-locale/lib/client.js:7-8` **[V]**:
```js
let react_jsx_runtime = require("react/jsx-runtime");
let react = require("react");
```

**Components are plain React components.** They do not import the renderer and never touch React
internals:

> `dsh-client-ui-renderer/README.md:36` **[V]** — "A business plugin registers an ordinary Slot entry
> or a reusable Component Factory; the renderer binds the runtime's session and workspace observable
> sources into selector hooks at the render position. The plugin receives standard scope props
> through its derived Component props — it never imports the renderer or touches React internals."

---

## 5. Slot registration API

### 5.1 The two calls: `inject` (wait for declaration) then `register`

A child slot only exists while a *parent* entry has declared it. A plugin therefore **waits** for
the declaration, then registers inside it:

`dsh-client-ui-brand-official/lib/client.js:35-40` **[V]** — the minimal complete example:
```js
function apply(ctx) {
	ctx.slots.inject("sidebar.brand.mark", () => ctx.slots.inject("sidebar.brand.name", function* () {
		yield ctx.slots.register({ name: "sidebar.brand.mark" }, OfficialBrandMark);
		yield ctx.slots.register({ name: "sidebar.brand.name" }, OfficialBrandName);
	}));
}
```

`ctx.slots.inject(key, callback)` documented at `dsh-client-ui-renderer/lib/client.js:1328-1342` **[V]**:
```
* Install an effect for each declaration lifetime of a slot. The callback
* runs synchronously when the declaration already exists; otherwise it runs
* inside the declaring `register()` call after the declaration is committed.
* Collapse disposes the effect and a later declaration runs it again.
* Callback effects are synchronous disposers; iterable effects install
* transactionally and dispose in reverse order. The controller belongs to the
* caller's fiber, so plugin unload cancels a pending wait and removes any
* active contribution.
```
The callback may return `() => void` **or** an iterable of disposers — implementation at
`:1343-1402` (it wraps `callback` in `ctx.effect`). Note the generator form above: `function*`
yielding disposers is the "iterable effect" branch of `ctx.effect`.

`ctx.slots.register(options, Component)` documented at `dsh-client-ui-renderer/lib/client.js:1788-1791` **[V]**:
```js
SlotRegistry.prototype.register = function register(rawOptions, component) {
	const options = rawOptions;
	return this.ctx.effect(() => this["_register"](options, component), "slots.register()");
};
```
It returns the effect's disposer.

### 5.2 Complete `register` options, from the implementation

`dsh-client-ui-slots/lib/index.js:163-243` **[V]** is the authoritative validator. Quoted validation
logic:

```js
register(options, component) {
	const rec = this.records.get(options.name);
	if (!rec?.spec) throw new Error(`slot "${options.name}" is not declared (a parent entry's children table must declare it)`);
	const spec = rec.spec;
	const priority = options.priority ?? 0;
	switch (spec.kind) {
		case "single": {
			const occupant = rec.entries.find((e) => (e.options.priority ?? 0) === priority);
			if (occupant) throw new Error(`single slot "${options.name}" already has a registration ...`);
			break;
		}
		case "keyed": {
			if (options.key === void 0) throw new Error(`keyed slot "${options.name}" requires options.key`);
			...
		}
		case "list": {
			if (options.id === void 0) throw new Error(`list slot "${options.name}" requires options.id`);
			...
		}
		case "chain":
			if (options.select === void 0) throw new Error(`chain slot "${options.name}" requires options.select`);
			break;
	}
	if (options.children) for (const childKey of Object.keys(options.children)) { /* re-declaration throws */ }
	...
}
```

| option | required when | meaning (source) |
|---|---|---|
| `name` | always | the slot key (`:164-165`) |
| `key` | slot kind is `keyed` | dispatch cell; `:176` |
| `id` | slot kind is `list` | entry identity; `:182` |
| `order` | list only (for display order) | ascending; `:221` sorts list by `priority` then `order` |
| `priority` | no (default `0`) | shadowing cell — **lowest renders**; `:167-168` |
| `label` | no | string **or thunk** resolved per-locale (`resolveSlotLabel`, `lib/index.js:27-29`) |
| `select` | slot kind is `chain` | elects the entry; `:188`, `:1155` renderer |
| `inject` | no | factory producing the plugin's business props — see §5.4 |
| `children` | no | declares child slots this entry will render; `:191-194`, `:224-236` |
| `store` | no | a `defineStore(...)` handle — see §5.5 |
| `locale` | no | a dictionary namespace; gives the component `t` — see §8 |
| `registrant` | no | a diagnostic string only (`:218`, snapshot output `:337`) |

**Slot kinds** (`dsh-client-ui-slots/README.md:28` **[V]**): `single` (one occupant), `list`
(ordered entries), `keyed` (dispatch by a key), `chain` (entries elect themselves). Declarations are
made by the *parent's* `children:` table, with `{ kind, scope }` per child key; `scope` is one of
`"root" | "session" | "session-maybe"` (`dsh-client-ui-conversation/lib/client.js:18143-18149` **[V]**).

**Declaring is exclusive.** `dsh-client-ui-slots/README.md:46` **[V]** — "Declaring a slot is
claiming it: the registering entry becomes the only entry allowed to render that key, and
registering into an undeclared slot, declaring an already-declared child, mounting one shared handle
under two scopes, or registering a chain without `select` throws at load."

### 5.3 Full working example (from a shipped plugin)

**Declaring children + a store seat + a service, then registering the root occupant** —
`dsh-client-ui-layout/lib/client.js:585-673` **[V]**, complete and unedited:

```js
ctx.effect(() => {
	const handle = createLayoutStore();
	const instance = handle.create();
	const store = {
		...handle,
		create: () => instance
	};
	const retainMainPanels = () => {
		instance.actions.retainMainPanels(ctx.slots.entries("main").flatMap((entry) => entry.options.key === void 0 ? [] : [entry.options.key]));
	};
	const layout = new LayoutController(instance.actions, (id) => ctx.slots.entries("main").some((entry) => entry.options.key === id), {
		getSnapshot: () => instance.getSnapshot().panelInfo,
		subscribe: (listener) => instance.subscribe(listener)
	});
	const disposePanelInfo = ctx.slots.provideRoot({ hooks: { panelInfo: layout.panelInfo } });
	const disposeService = ctx.reflect.provide("layout", layout);
	const disposeRegistration = ctx.slots.register({
		name: "root",
		locale: "common",
		children: {
			"sidebar":        { kind: "single", scope: "root" },
			"main":           { kind: "keyed",  scope: "root" },
			"rightbar":       { kind: "single", scope: "root" },
			"shell.overlay":  { kind: "list",   scope: "root" },
			"shell.leading":  { kind: "single", scope: "root" }
		},
		store
	}, AppFrame);
	const disposeShortcut = ctx.shortcuts.register({ /* ... */ });
	const disposePanels = ctx.slots.subscribe("main", retainMainPanels);
	retainMainPanels();
	return () => {
		disposeShortcut();
		layout.dispose();
		disposePanels();
		disposeRegistration();
		disposePanelInfo();
		disposeService();
	};
}, "ui-layout: service + root registration");
```

**Registering into a session-scoped list slot with a private activation source and mutation verbs** —
`dsh-client-ui-goal/lib/client.js:557-604` **[V]** (abridged only where marked):

```js
ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
	name: "conversation.input.dock",
	id: "goal",
	order: 10,
	locale: NS,
	inject: (sessionId) => {
		const binding = sessions.binding(sessionId);
		if (binding === void 0) throw new Error(`ui-goal: session "${sessionId}" is unavailable`);
		return {
			hooks: { goalActivation: createGoalActivationSource({
				projection: binding.session.projections.faceOf("goal"),
				session: binding.session,
				getGoal: async () => { /* ... ctx.remote.goals.get(sessionId) ... */ },
				subscribeActivation: (listener) => ctx.remote.$on("goal/activation-changed", (event) => {
					if (event.sessionId === sessionId) listener(event.goal);
				}),
				subscribeReset: (listener) => ctx.on("connection/reset", listener)
			}) },
			onEdit:  async (objective) => { /* ctx.remote.goals.edit(sessionId, ref, { objective }) */ },
			onPause: async () => { /* ctx.remote.goals.pause(sessionId, ref) */ },
			onResume:async () => { /* ctx.remote.goals.resume(sessionId, ref) */ },
			onClear: async () => { /* ctx.remote.goals.clear(sessionId, ref) */ }
		};
	}
}, GoalDock));
```

and the corresponding component signature (`dsh-client-ui-goal/lib/client.js:372` **[V]**):
```js
function GoalDock({ useProjection, useGoalActivation, onEdit, onPause, onResume, onClear, t }) {
	const projection = useProjection("goal");
	...
```

**Declaring a child slot and registering the parent, with a self-updating section** —
`dsh-client-ui-settings-plugins/lib/client.js:201-212` **[V]**:
```js
ctx.slots.inject("settings.section", () => ctx.slots.register({
	name: "settings.section",
	id: "plugins",
	order: 15,
	label: () => t("nav"),
	locale: NS,
	inject: sectionInjected,
	children: { "settings.plugins.tab": { kind: "list", scope: "root" } }
}, PluginsSettingsSection));
```

**Registering a keyed configuration page (documented example)** —
`dsh-client-ui-plugin-manager/README.md:62-68` **[V]**:
```tsx
ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
  name: 'plugins.row.config',
  key: '@acme/dsh-sidebar#sidebar',
  locale: 'acmeSidebar',
}, ({ t, view }) => view === 'summary' ? t('summary') : <SidebarForm t={t} />))
```

### 5.4 The exact props a registered component receives

Built by `standardKit()` — `dsh-client-ui-renderer/lib/client.js:703-745` **[V]**. Verbatim:

```js
/**
* Standard-kit synthesis shared by both scope branches: the global
* useSessions/useWorkspaces hooks, the per-session provide bundle (every
* `hooks` source becomes a `use<Name>` selector hook — useSession is the
* runtime's own 'session' contribution, no special case — and `props` spread
* verbatim), the store pair when declared, the renderSlot binding when
* children are declared, and the SessionProvider seat when the children
* declare a session-scope slot. Hosts hand out BARE observable sources
* (hooks never cross the host contract); every hook is bound HERE, cached
* per source (observableHook), so spreading a fresh kit object per render
* never churns child subscriptions.
*/
function standardKit(host, entry, scope, rootBinding, scopeBinding) {
	const standard = standardProps(scope, rootBinding, scopeBinding);
	const kit = {
		...standard,
		renderFactorySlot: boundRenderFactorySlot(entry)
	};
	if (entry.locale !== void 0) {
		const face = host.locale;
		if (face === void 0) throw new SlotAssemblyError(`entry declares locale namespace '${entry.locale}' but no locale face is installed (locale plugin missing from the composition?)`);
		kit["t"] = localeSeat(face, entry.locale);
	}
	const scopedStoreBinding = scopeBinding?.key === void 0 ? void 0 : scopeBinding;
	const store = host.storeOf(entry, scopedStoreBinding);
	if (store !== void 0) {
		kit["useStore"] = observableHook(store);
		kit["actions"] = store.actions;
	}
	if (entry.children !== void 0) {
		kit["renderSlot"] = boundRenderSlot(host, entry);
		if (Object.values(entry.children).some((spec) => spec.kind === "chain")) kit["renderSlotChain"] = boundRenderSlotChain(host, entry);
		if (Object.values(entry.children).some((spec) => spec.scope !== "root")) {
			const adapter = host.scope("session");
			if (adapter === void 0) throw new SlotAssemblyError("entry declares a session child without an installed 'session' scope adapter");
			kit["SessionProvider"] = scopeAreaProvider(adapter);
		}
	}
	...
}
```

Props table (all **[V]**):

| prop | present when | source line |
|---|---|---|
| *(everything from `inject`)* | `inject` option set | `:718-720` + `bindInjectSources` `:424-439` |
| `renderFactorySlot` | always | `:719` |
| `t` | `locale:` option set | `:721-725` |
| `useStore` | `store:` option set | `:727-730` |
| `actions` | `store:` option set | `:730` |
| `renderSlot` | `children:` option set | `:732-733` |
| `renderSlotChain` | a child of kind `chain` | `:734` |
| `SessionProvider` | a child with a non-`root` scope | `:735-739` |
| `useSession`, `useProjection`, `sessionId` | scope is `session` / `session-maybe` | `dsh-client-ui-session/lib/client.js:121-129` |
| `owner` | merged last, at the render boundary | `:749-751`, `:768`, `:776` |
| `renderSlot`'s own owner arg | per-call | `:329-342` |

Session standard-source descriptor, `dsh-client-ui-session/lib/client.js:121-130` **[V]**:
```js
const BUILTIN_SOURCE = {
	hooks: ["session"],
	keyedHooks: ["projection"],
	props: ["sessionId"],
	resolve: (binding) => ({
		hooks: { session: binding.session },
		keyedHooks: { projection: (key) => binding.session.projections.faceOf(key) },
		props: { sessionId: binding.sessionId }
	})
};
```
`hooks: {...}` names become **selector hooks** `use<Name>` (`standardHookPropName`,
`dsh-client-ui-slots/lib/index.js:7-9` **[V]**); `keyedHooks` become keyed hooks
(`useProjection("goal")`); `props` are spread verbatim. Hence a `session`-scoped component sees
`useSession`, `useProjection`, `sessionId` (`useGoalActivation` in the goal example is a
plugin-supplied hook the same way).

`owner` — precedence rule at `dsh-client-ui-renderer/lib/client.js:749-751` **[V]**:
```
* + owner props (owner wins).
```
Duplicate props throw (`assertNoPropOverlap`, `:922-925` **[V]**):
```js
function assertNoPropOverlap(owner, provided, received) {
	for (const name of Object.keys(received)) if (Object.hasOwn(provided, name)) throw new SlotAssemblyError(`${owner} received duplicate prop '${name}'`);
}
```

`renderSlot` is **statically narrowed to the entry's declared children** — calling it for an
undeclared key throws (`:331-333` **[V]**):
```js
const declared = entry.children?.[key];
if (declared === void 0) throw new SlotOwnershipError(`slot '${key}' is not declared by this entry's children`);
```
and it is dead after the entry disposes (`StaleAuthorizationError`, `:330`).
`renderSlot(key, owner, opts)` — `opts` supports `{ fallback, overlay, entryKey }`
(`:1150-1204` **[V]**); real call sites: `renderSlot("conversation.header", {})`,
`renderSlot("conversation.session.header.actions", {})`,
`renderFactorySlot("conversation.content", {...})` (`ui-conversation/lib/client.js:16021, 16502, 17536` **[V]**).

`ctx.slots` also exposes: `entries(key)` (`:1517`), `entriesOfSlot(key)` (`:1529`),
`subscribe(key, fn)` (`ui-slots:393-399`), `getVersion(key)` (`:423-425`),
`subscribeDeclaration(key, fn)` (`:410-416`), `provideRoot(contribution)` (`:1440-1459`),
`spec/specDynamic`, `snapshot(root)`, `onEntryError(fn)`. `ctx.slots.install(renderer)` and
`installLocale(face)` are **boot-once, shell-owned** (`:1409-1433` **[V]**) — a business plugin must
not call them.

### 5.5 Store seats

The `store` option takes the handle returned by `defineStore` from `@deepseek-ai/dsh-client-store`
(a **baseline** module, so no external entry needed).

Shape (`dsh-client-store/lib/index.js:147-176` **[V]**):
```js
function defineStore(decl) {
	return {
		spec: decl,
		create(scopeKey) { ... return { actions, getSnapshot, subscribe, store, clearPersisted }; }
	};
}
```
`decl` = `{ init: () => state, persist?: string, actions: { name: (draft, ...params) => void } }`
(`:144` doc comment; `:151` shows a scoped persist key is formed as `` `${decl.persist}.${scopeKey}` ``).
Real example — `dsh-client-ui-conversation/lib/client.js:3171-3198` **[V]**:
```js
function createConversationStore() {
	return defineStore({
		init: () => ({ draft: "", view: null, viewRequest: null }),
		persist: CONVERSATION_STORE_KEY,       // "dsh.conversation"
		actions: {
			setDraft: (d, text) => { d.draft = text; },
			setView:  (d, view) => { d.view = view; },
			openView: (d, view, focus) => { d.view = view; d.viewRequest = { view, focus }; },
			completeViewRequest: (d) => { d.viewRequest = null; }
		}
	});
}
```
The component then reads `useStore((s) => s.active)` and writes `actions.setView(...)`
(`dsh-client-ui-conversation/lib/client.js:18216, 18288` **[V]**). One handle may be mounted under
exactly one scope — a second scope throws (`ui-slots/lib/index.js:196-202`, `:82-90` **[V]**).

---

## 6. Account balance access from a client plugin

### 6.1 The call site (real, shipped)

`dsh-client-ui-settings-account/lib/client.js:4262-4265` **[V]**:
```js
}), read("balance", async () => {
	const result = await ctx.remote.account.getBalance(client());
	if (!result.ok) throw new Error("account balance failed");
	return result.value;
}));
```

and the client-identity builder, `dsh-client-ui-settings-account/lib/client.js:2694-2708` **[V]**:
```js
/**
* Build the request identity for one account call.
* @param locale - active UI language; the Host reduces it to the Platform wire locale.
* @param version - client build version inlined by the bundle.
* @returns the metadata the account Remote methods carry.
* @throws Error when the build carries no version, instead of reporting an empty one.
*/
function accountClientMetadata(locale, version) {
	if (version === void 0 || version === "") throw new Error("account: this client build carries no DSH_CLIENT_VERSION");
	return {
		version,
		locale,
		timezoneOffsetSeconds: -(new Date()).getTimezoneOffset() * 60
	};
}
```
called at `:4212` **[V]** as:
```js
const client = () => accountClientMetadata(ctx.locale.getSnapshot().active, "0.2.0-rc.2");
```
Note the version is a **hard-coded string literal inlined into the shipped bundle** — the build
substitutes it. **A plugin author must supply their own version string.**

### 6.2 Access path and required declarations

There is no import. The call is a plain method on the injected `ctx.remote` service, in the
`account` namespace.

`dsh-client-ui-settings-account/lib/client.js:4181-4190` **[V]** — the two declarations that make it
callable:
```js
/** Services required by account settings. */
const inject = [
	"slots",
	"locale",
	"remote",
	"remote.account",
	"remote.session",
	"theme",
	"configForms"
];
```
plus `package.json` `dsh.client.inject: ["@deepseek-ai/dsh-api-remotes", ...]`
(`dsh-client-ui-settings-account/package.json:28-40` **[V]**) so the remotes bundle materializes
first.

`"remote"` is provided by the Gateway client (`dsh-api-gateway/package.json:32-38` **[V]**:
`dsh.client.inject: ["@deepseek-ai/dsh-typert-registry", "@deepseek-ai/dsh-client-connection"]`,
`immediately: true`); the `account` namespace is mounted by `dsh-api-remotes`
(`dsh-api-remotes/README.md:92` **[V]**: "The Client assembly includes the account namespace for
login commands and reconnectable account snapshots.").

`"remote.account"` is a **dotted child service name** — the same form used for `remote.session`,
`remote.goals` (`dsh-client-ui-goal/package.json:31-32` + `lib/client.js:521` **[V]**).

### 6.3 Return shape

**Every unary Remote call returns `RemoteResult<T>` — `{ ok: true, value }` or `{ ok: false, error }`**
(`dsh-api-gateway/README.md:56` **[V]**):
> "Every unary call resolves to `RemoteResult<T>` — `{ ok: true, value }` or `{ ok: false, error }` —
> and never rejects for a carrier problem: this face folds an offline carrier into the error branch
> and answers `gateway/cancelled` when the caller's signal aborts, so no consumer wraps a call to
> recover one. Only an assembly fault still rejects: wrong arity, an unmounted method, a withdrawn
> contribution, a missing Context adapter. `error` is a live `RemoteError` instance, so
> `throw result.error` keeps throw semantics, and `isRemoteFailure(value)` is the one predicate a
> consumer needs."

**`getBalance`'s payload, exactly.** Generated codec,
`dsh-api-account-controller/lib/typert.remote-client.js:39-52` **[V]**:

```js
let _deepseek_ai_dsh_api_account_controller_account_getBalance_result$schema$value
const _..._getBalance_result$schema = () => (_... ??= z.union([z.literal(null), z.object({
  'status': z.literal("ready").readonly(),
  'value': z.array(z.object({
  'currency': z.union([z.literal("CNY"), z.literal("USD")]).readonly(),
  'balance': z.string().readonly(),
})).readonly(),
  'bonusWallets': z.array(z.object({
  'currency': z.union([z.literal("CNY"), z.literal("USD")]).readonly(),
  'balance': z.string().readonly(),
})).readonly(),
}), z.object({
  'status': z.literal("failed").readonly(),
})]))
```

Parameter codec, `:33-38` **[V]**:
```js
const _..._getBalance_parameter_0$schema = () => (...
  = z.object({
  'version': z.string().readonly(),
  'locale': z.string().readonly(),
  'timezoneOffsetSeconds': z.number().readonly(),
}))
```

So the **exact runtime shape** is:

```ts
getBalance(client: { version: string; locale: string; timezoneOffsetSeconds: number })
  : Promise<
      | { ok: true;  value:
            | null                                                   // absent/changed grant
            | { status: 'ready';  value: Wallet[]; bonusWallets: Wallet[] }
            | { status: 'failed' } }
      | { ok: false; error: RemoteError }
    >
// Wallet = { currency: 'CNY' | 'USD'; balance: string }   // decimal STRING, not a number
```

**No `AccountDetails` wrapper crosses the wire.** `AccountDetails` is a *client-local* view-model
built by the settings-account plugin, not a Remote type. The client assembles it itself (`:4250-4257`
**[V]**) as `{ profile?: ..., balance?: ... }`, and the component reads it as
`details?.balance?.status === "ready" ? details.balance.value : void 0`
(`dsh-client-ui-settings-account/lib/client.js:2317-2318` **[V]**). `balance.value` = topped-up
wallets, `balance.bonusWallets` = granted wallets — matching
`dsh-deepseek-account/README.md:53` **[V]**: "A ready `AccountDetails.balance` keeps recharge wallets
in `value` and bonus wallets in `bonusWallets`; both arrays preserve decimal strings and currency."

Host declaration of the method — `dsh-api-account-controller/lib/types/index.js:98-105` **[V]**:
```js
/** Query Platform recharge-wallet balances.
 * @param client - identity of the requesting UI; the Host derives Platform request headers from it.
 * @returns balance outcome, or null when the account grant is absent or changed. */
getBalance(client) { return this.ctx.deepseekAccount.getBalance(client); }
```
namespace binding at `:82` **[V]**: `super(ctx, 'accountController', { namespace: 'account' })`
(`TypertRemoteService`).

### 6.4 Platform client identity headers (what `client` becomes)

`dsh-deepseek-account/lib/index.js:68-86` **[V]**:
```js
function platformClientHeaders(platform, client) {
	return {
		"x-client-bundle-id": "",
		"x-client-platform": "web",
		...desktopClientHeaders(platform),
		"x-client-version": client.version,
		"x-client-locale": platformWireLocale(client.locale),
		"x-client-timezone-offset": String(client.timezoneOffsetSeconds)
	};
}
function platformWireLocale(locale) {
	return locale.toLowerCase().split(/[-_]/)[0] === "zh" ? "zh_CN" : "en_US";
}
```

### 6.5 Practical recipe

```js
// dsh.client.inject must contain "@deepseek-ai/dsh-api-remotes"
const inject = ["slots", "locale", "remote", "remote.account"];

async function readBalance(ctx) {
  const meta = {
    version: "0.2.0-rc.2",                                  // your own build's version
    locale: ctx.locale.getSnapshot().active,                 // "zh" | "en"
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60
  };
  const result = await ctx.remote.account.getBalance(meta);
  if (!result.ok) throw result.error;                        // RemoteError
  const balance = result.value;                              // null | {status} union
  if (balance?.status !== "ready") return null;
  return [...balance.value, ...balance.bonusWallets];         // [{currency, balance}]
}
```
Note the shipped plugin renders a `status: "failed"` payload as an inline error and treats a
**thrown** call (carrier/assembly fault) as `{ status: "failed" }`
(`dsh-client-ui-settings-account/lib/client.js:4243-4256` **[V]**). `getBalance` also requires the
account to be signed in; a `null` payload means the grant is absent or changed.

Companion methods in the same namespace (all `@Remote`, all taking `client` unless noted) —
`dsh-api-account-controller/README.md:23` **[V]**: `getState`, `getProfile`, `getBalance`,
`getUnnotifiedBonuses`, `ackBonusNotified`, `startSignIn`, `cancelSignIn`, `signOut`, `watch`
(stream), `watchExpiry` (stream), `hasRunningAccountTasks`.

An alternative, **non-Remote** route used by the same package is the reconnectable
`ctx.remote.$stream({ name: "account", open: (signal) => ctx.remote.account.watch(signal), ended: … })`
(`:4276-4285` **[V]**) — the account view itself is a snapshot stream, not a poll.

---

## 7. Install procedure

### 7.1 The desktop profile is app-managed; the CLI cannot boot it, but it *can* run `dsh plugin`

Two separate checks, verified in `dsh/lib/bin.js` **[V]**:

```js
// :35-37
function rejectElectronProfile(program, profile) {
	if (profile.toLowerCase() === "desktop") program.error("error: profile \"desktop\" is managed exclusively by the Electron application");
}
// :115-126  (the `plugin` subcommand)
if (first === "plugin") {
	const plugin = program.command("plugin")...action((args, options) => {
		if (options.profile === "") program.error("error: --profile needs a name");
		if (!manageDesktopProfile) rejectElectronProfile(plugin, options.profile);   // <-- still enforced
		...
		resolved = { mode: "plugin", profile: options.profile.toLowerCase() === "desktop" ? "desktop" : options.profile, args };
	});
}
```

**Answer:** `dsh --profile desktop …` (boot, `--dump-config`, `--dump-config-schema`) is
**rejected**. `dsh plugin --profile desktop <pnpm args>` is **rejected by the npm-installed CLI**,
because `manageDesktopProfile` defaults to `false` (`parseDshArgs(argv, version, manageDesktopProfile = false)`,
`:101`) and the `plugin` action still calls `rejectElectronProfile`.

> `dsh/README.md:20` **[V]** — "The `desktop` name is reserved for the Electron-owned profile, so
> the CLI rejects boot and config-dump requests for it. **The npm CLI also rejects its
> plugin-management requests; the Desktop-installed command can manage the initialized Desktop
> profile using that installation's runtime.**"

The Desktop-carried command flips that flag —
`dsh-desktop-host/lib/cli.js:91-105` **[V]**:
```js
async function runDesktopCli(runtimeDir, supportDir) {
	installOfficeEngineResolution(runtimeDir);
	await runCli({
		manageDesktopProfile: true,
		packageManager: {
			command: process.execPath,
			args: ["--expose-internals", join(supportDir, "pnpm", "bin", "pnpm.mjs")],
			env: { ELECTRON_RUN_AS_NODE: "1", DSH_DESKTOP_NODE_EXECUTABLE: process.execPath, PATH: ... }
		}
	});
}
```

And it still requires the profile to be initialized by the app —
`dsh/lib/plugin-BGnVfe_D.js:10-12` **[V]**:
```js
function requireDesktopProfile(dir) {
	if (!existsSync(join(dir, "package.json"))) throw new Error("Open DeepSeek Harness Desktop once to initialize its profile, then fully quit it before running dsh plugin --profile desktop.");
}
```

### 7.2 Is a local directory path accepted? Yes.

`dsh-plugin-manager/lib/types/install-spec.js:57-86` **[V]** parses the spec; paths are `path` or
`tarball` kinds, and **must be absolute**:

```js
const path = spec.replace(/^(?:file|link):/, '');
if (path !== spec || isAbsolute(path)) {
	if (!isAbsolute(path)) throw invalid(spec, 'a local path must be absolute');
	return TARBALL_SPEC.test(path) ? { kind: 'tarball', spec, path } : { kind: 'path', spec, path };
}
if (/^\.{1,2}(?:[\\/]|$)/.test(spec)) throw invalid(spec, 'a local path must be absolute');
```
A `file:` or `link:` prefix is accepted (stripped), and the remainder must still be absolute.
Accepted forms overall: registry name (`name` or `name@range`), git (host shorthand / git URL /
hosted repo URL), tarball (local or http(s) `.tgz`/`.tar.gz`), absolute path.

Pre-install compatibility check (`dsh-plugin-manager/README.md:63` **[V]**): "a local path is read
from its own `package.json`, and a registry spec is resolved through pnpm's registry lookup for the
version its range selects and the peers that version declares. An incompatible DSH peer rejects the
operation before pnpm runs."

### 7.3 What happens mechanically on install

1. `pnpm add <spec>` runs in the profile directory (`~/.dsh/profiles/desktop`).
2. If the package declares `dsh.bundle`, its patch file(s) are loaded and its name is **appended to
   `dsh.profile.bundles`** in the profile `package.json` (`dsh-plugin-manager/lib/index.js:247-265`).
   If it declares no `dsh.bundle`, it is installed as a plain dependency and a warning is printed —
   it is **not** a layer, and **not** enabled.
3. "Installation enables a new bundle by default" (`README.md:40`), and "Installation finishes after
   pnpm and bundle validation succeed" (`:148`).
4. A failed/cancelled install restores the snapshotted `package.json` and `pnpm-lock.yaml` (`:94`).

### 7.4 The in-app Web sidebar "Plugins" page

`dsh-client-ui-plugin-manager/README.md:14, 44, 56` **[V]**:
* "Use the **Plugins** entry in the Web sidebar to manage the profile's installed bundles and the
  official bundles the installation ships switched off. Switch bundles and their rows on and off,
  install a bundle after the Host has read what the spec names, watch pnpm's output, stop a run, and
  enable what it added."
* "**Add plugin** takes a package name with an optional version, a Git address, a tarball, or an
  **absolute local path**".
* "A row's switch on the bundle's page calls `pluginManager.setPluginEnabled`, which writes the
  row's `disabled` override into the profile's `cordis.patch.yml`."
* It registers a configuration page per bundle via three slots it declares — `plugins.item` (list),
  `plugins.bundle.config` (keyed by bundle package name), `plugins.row.config` (keyed by
  `<package name>#<row id>`) (`:60`).
* "**the browser half attaches to the Loader row whose specifier is the bare package name**, so
  every page a bundle registers … goes away when that row is switched off; a sub-plugin whose page
  must outlive the other rows ships as its own package." (`:110` **[V]**)
* Limitations (`:148-154` **[V]**): "**Only bundles are managed** — a dependency without a bundle
  patch is refused before it installs"; "**One install at a time**"; "**No version picker** —
  … upgrading means uninstalling and installing the new version"; "**Page lifetime** — refreshing the
  browser loses the tracked request and output"; "Desktop package operations remain owned by the
  Desktop shell" (`dsh-plugin-manager/README.md:135`).

The page reads through `api-remotes`; "a Host without a managed profile shows the page as
unavailable" (`:30`).

**Which surface to use:** for the Electron app on this machine, the in-app **Plugins** page is the
supported path (it runs the Desktop-owned package manager and holds the profile lock). `dsh plugin
--profile desktop add <abs-path>` works only from the Desktop-installed CLI carrier, not from an
npm-installed `dsh`.

### 7.5 Row enablement

A row is on unless `disabled: true` (or a `!!js` expression evaluating truthy). Toggle writes the
**last matching override's** `disabled` into the profile's `cordis.patch.yml`, or appends an
override when none matches; "Matching uses the entry id and any module-name assertion"
(`dsh-plugin-manager/README.md:40` **[V]**).

---

## 8. i18n / locale

### 8.1 Registration

A plugin registers a **namespace** with per-language flat dictionaries, inside an effect:

`dsh-client-ui-goal/lib/client.js:514-534` **[V]**:
```js
/** Dictionary namespace owned by this plugin. */
const NS = "goal";
...
ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-goal: dictionaries");
```
`dsh-client-ui-layout/lib/client.js:491-495, 580-584` **[V]**:
```js
/** Layout command labels. */
const zh = { toggle: "展开／收起左侧栏" };
/** English labels for the same layout commands. */
const en = { toggle: "Toggle left sidebar" };
...
ctx.effect(() => ctx.locale.register("shortcuts.layout", { zh, en }), "layout: command labels");
const t = ctx.locale.bind("shortcuts.layout");
```

Two accepted signatures — `dsh-client-locale/lib/client.js:1387-1396` **[V]**:
```js
register(ns, localeOrDicts, dict) {
	const pairs = typeof localeOrDicts === "string" ? [[localeOrDicts, dict]] : Object.entries(localeOrDicts);
	for (const [locale] of pairs) if (!LOCALE_ID_PATTERN.test(locale)) throw new Error(`locale id "${locale}" is not a BCP 47-style tag`);
	let locales = this.dicts.get(ns);
	if (!locales) { locales = new Map(); this.dicts.set(ns, locales); }
	for (const [locale] of pairs) if (locales.has(localeKey(locale))) throw new Error(`locale namespace "${ns}" already has locale "${locale}"`);
	for (const [locale, entries] of pairs) locales.set(localeKey(locale), entries);
	this.publish(this.snapshot.active, false);
	return () => { /* removes those exact entries */ };
}
```
* `register(ns, { zh: {...}, en: {...} })` — the map form (normal).
* `register(ns, "zh", {...})` — the single-locale form.
* Locale ids must match `/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u` (`:920` **[V]**). `LOCALE_IDS = ["zh", "en"]` (`:922`) are the shipped locales; `en` is the fallback (`:1135`, `:1382`).
* **Registering the same locale twice in one namespace throws.**
* The returned disposer removes exactly those entry objects — so it is idempotent and safe on HMR.

### 8.2 Dictionary shape

Flat `{ "key": "text" }` maps. Verified from the shipped `common` namespace
(`dsh-client-locale/lib/client.js:929-1017` **[V]**):
```js
const zh$1 = {
	"ok": "确定",
	"cancel": "取消",
	"copy.json": "复制 JSON",
	"copy.optionsHint": "{action}；右键点击可选择复制方式",
	"number.thousand": "{value}K",
	...
};
const en$1 = { "ok": "OK", "cancel": "Cancel", ... };  // checked complete against the zh key set
```
Interpolation is `{name}` — `dsh-client-locale/lib/client.js:1423-1428` **[V]**:
```js
translate(ns, key, params) {
	const chain = this.fallbackChain(this.snapshot.active);
	const template = this.lookup(ns, key, chain) ?? (ns !== "common" ? this.lookup("common", key, chain) : void 0) ?? key;
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
}
```
Lookup order (`:1423-1435` **[V]**): active-locale fallback chain in the plugin's own namespace,
then the same chain in the shared `"common"` namespace, then the key itself. A miss renders the key.
`t(key, params)` with `t("kill.confirmAction")` and `t("queue.count", { n: rowCount })` seen in
shipped code.

### 8.3 Wiring the namespace into a component

Two distinct mechanisms — **both required for different jobs**:

1. **`locale:` in the slot registration** gives the component the `t` prop.
   `dsh-client-ui-layout/lib/client.js:601-604` **[V]**:
   ```js
   const disposeRegistration = ctx.slots.register({
   	name: "root",
   	locale: "common",
   	...
   ```
   `dsh-client-ui-conversation/lib/client.js:17960-17965` **[V]**:
   ```js
   ctx.slots.inject("settings.general.item", () => ctx.slots.register({
   	name: "settings.general.item",
   	id: "enter",
   	order: ...,
   	locale: NS,
   ```
   If the namespace is missing at render time the renderer throws (`ui-renderer/lib/client.js:723`):
   `entry declares locale namespace '<ns>' but no locale face is installed (locale plugin missing from the composition?)`.
   The shipped `t`-using components: `function LanguageRow({ t, setLocale, useStore })`
   (`dsh-client-locale/lib/client.js:1056`); `function GoalBar({ goal, activation, onEdit, onPause, onResume, onClear, t })` (`ui-goal/lib/client.js:171`).

2. **`ctx.locale.bind(ns)` in `apply`** gives the plugin body a callable `t` for `label:` thunks and
   non-component code — `dsh-client-ui-goal/lib/client.js:531-538` and
   `dsh-client-locale/lib/client.js:1414-1422`:
   ```js
   bind(ns) {
   	let t = this.bound.get(ns);
   	if (!t) { t = (key, params) => this.translate(ns, key, params); this.bound.set(ns, t); return t; }
   	return t;
   }
   ```
   `bind` caches the function, so it is stable across renders. Used for the `label` thunk
   (`label: () => t("nav")`, `ui-settings-plugins/lib/client.js:205`) and for accessors
   (`dsh-client-ui-settings-plugins/lib/client.js:176-200`).

Re-render on locale switch is automatic: every outlet subscribes to the installed face's revision
(`useLocaleRevision`, `ui-renderer/lib/client.js:567-570` **[V]**), and `localeSeat` is cached per
`(face, ns, revision)` (`:521-526`).

`ctx.locale.getSnapshot()` → `{ active, locales: [{id,label,fallback?}], revision }`
(`dsh-client-locale/lib/client.js:1216-1220`). The service is provided by `dsh-client-locale`
(`:1526 ctx.provide("locale", locale)`) and its face installed with
`ctx.slots.installLocale(locale)` (`:1533`).

**Plugin display metadata** (title/description shown on the Plugins page) is a *separate* channel —
exported locale `meta` or the package's `package.json` (`dsh-client-ui-plugin-manager/README.md:32`
**[V]**); `PluginLocalizedMeta` carries "optional display title, description, an image data URL
resolved from `package.json.icon`" (`dsh-package-manifest/README.md:55` **[V]**).

---

## 9. Copy-paste skeleton (assembled from the verified pieces above)

```
@acme/dsh-sidebar/
  package.json
  cordis.patch.yml
  lib/index.js          // export function apply() {}
  lib/client.js         // window.__ModuleLoader__.load({ id, factory })
```

`package.json`:
```json
{
  "name": "@acme/dsh-sidebar",
  "version": "0.1.0",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".":              { "types": "./lib/types/index.d.ts",        "default": "./lib/index.js" },
    "./client":       { "types": "./lib/types/client/index.d.ts", "default": "./lib/client.js" },
    "./package.json": "./package.json"
  },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "platform": "web",
      "inject": ["@deepseek-ai/dsh-client-ui-renderer", "@deepseek-ai/dsh-client-ui-sidebar"]
    }
  },
  "peerDependencies": { "@deepseek-ai/cordis": "~4.0.4" },
  "files": ["lib/index.js", "lib/client.js", "cordis.patch.yml", "lib/types/**/*.d.ts"]
}
```

`cordis.patch.yml`:
```yaml
- insert:
    - id: acme-sidebar
      name: '@acme/dsh-sidebar'
```

`lib/index.js`:
```js
/** Host half: exists only so the Loader has a row; the browser half rides dsh.client. */
export function apply() {}
```

`lib/client.js` (source form — the build wraps it into the `__ModuleLoader__.load` factory):
```js
import { jsx } from 'react/jsx-runtime'          // baseline module: no external entry needed
import { defineStore } from '@deepseek-ai/dsh-client-store'   // baseline module

const NS = 'acmeSidebar'
const zh = { title: '侧栏条目' }
const en = { title: 'Sidebar item' }

const store = defineStore({
  init: () => ({ count: 0 }),
  actions: { bump: (d) => { d.count += 1 } }
})

function AcmeRow({ t, useStore, actions }) {
  const count = useStore((s) => s.count)
  return jsx('button', { onClick: () => actions.bump(), children: `${t('title')} (${count})` })
}

/** Cordis service injection — the module exports ARE the plugin object. */
export const inject = ['slots', 'locale']

export function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'acme: dictionaries')
  ctx.slots.inject('sidebar.footer', () => ctx.slots.register({
    name: 'sidebar.footer',     // must be declared by the parent entry's children table
    id: 'acme-row',             // required iff the slot kind is `list`
    order: 50,
    locale: NS,                 // yields the `t` prop
    store                       // yields `useStore` + `actions`
  }, AcmeRow))
}
```

Checklist that the verified sources say will actually load:
- `exports["./client"].default` exists and the file exists (`clientExportOf`).
- `dsh.client.platform === "web"`.
- Every non-baseline `require(...)` is in `dsh.client.external` **or** in the `dsh.client.inject`
  closure **or** is the bare package name of another mounted row.
- No `@deepseek-ai/dsh*` peer range that fails against `0.2.0-rc.2` (or omit them).
- `lib/client.js` is the `window.__ModuleLoader__.load({id, factory})` wrapper, with all side effects
  inside `factory` and every `<style>` tagged `data-plugin`.
- `ctx.slots.inject(key, …)` is used for any slot the plugin does not itself declare.

---

## 10. Known unknowns / risks

1. **`dsh.client.immediately` semantics are unverified.** The field is accepted and validated
   (`dsh-client-modules/lib/index.js:68`, `:726`) and carried into the boot-graph row
   (`lib/index.js:401`, `lib/client.js:127`, `:138`), but **nothing in the extracted browser bundle
   reads it** — `grep immediately` over `dsh-client-modules/lib/client.js` and over
   `dsh-web-frontend/dist/assets/index-5SrrfWpU.js` found only the parse/plumbing sites. Its
   behavioural effect is unknown. Do not rely on it; `immediately: true` is used only by
   `dsh-client-modules`, `dsh-client-connection`, `dsh-client-ui-renderer`, `dsh-api-remotes`, and
   `dsh-api-gateway`.
2. **No shipped package declares `dsh.bundle` and `dsh.client` together.** The two are read by
   independent code paths, so combining them should work, but it is not exercised in this
   installation. If it fails, ship the bundle and register the client row from the bundle's own
   patch with two packages (a bundle package whose patch inserts a row naming a client package).
3. **`Config` on a client plugin has no verified consumption path.** `dsh-client-ui-conversation`
   exports `Config` (`lib/client.js:17899`) while its row in the shipped web patch declares no
   `config:`; whether the browser Loader applies row `config` to the module's `Config` schema was not
   traced. The client-side configuration channel that *is* verified is `ctx.configForms`
   (`dsh-client-locale/lib/client.js:1491-1495`, `:1517`). Treat row `config:` → client `Config` as
   unproven.
4. **`ctx.on('dispose')` is unverified as a client idiom.** It was not found in any shipped client
   plugin. `ctx.effect`'s returned disposer (sync or async) is the verified mechanism; the
   `ctx.on(...)` calls found are all ordinary events.
5. **No client plugin exports `name`.** Verified negative across 9 packages. The Loader supplies the
   entry name (`client.js:353-356`), so this is expected — but it also means a client module cannot
   self-identify for diagnostics or for `slots.register(..., {registrant})` (which is an option, not
   automatic).
6. **`lib/types/*.d.ts` are absent from this asar.** All type-level claims here (`SlotMap`,
   `DefineStore`, `RemoteResult`, `AccountDetails`, `DshClientManifest`) are reconstructed from
   runtime JS, generated zod codecs, and README prose — not from the actual declaration files. The
   shipped TypeScript *source* is not in the archive either (`docs/`, `.agents/notes/`, and every
   `src/` path referenced by the READMEs cannot be read). The READMEs explicitly name
   `.agents/notes/implemented/architecture/2026-07-22-slot-type-chain-implementation.md` and
   `2026-09-10-component-factories-and-local-slots.md` as the definitive composition model; those
   files are **not obtainable here**.
7. **`client-modules` rejects bundles that require another relative `client*.js` output
   synchronously.** `dsh-client-modules/README.md:68` **[V]**: "This protocol supports self-contained
   chunks only: entry and chunk outputs cannot synchronously require another relative `client*.js`
   output." A multi-chunk code-split build must therefore route cross-chunk references through
   `require.async`.
8. **Slots injectable by a third-party plugin are limited to those a first-party parent declares.**
   `"sidebar.footer"` in the skeleton above is illustrative — the real declared keys are whatever
   `dsh-web-app`'s roster of packages declares. Verified declared examples include:
   `settings.general.item` (list, `ui-locale:1553`, `ui-conversation:17960`), `settings.section`
   (list, `ui-settings-plugins:201`), `settings.launcher`, `settings.models.sign-in`,
   `settings.plugins.tab` (list), `conversation.chat.node` (keyed), `conversation.input.dock` (list),
   `conversation.input.activity`, `conversation.session.header.actions` (list),
   `conversation.header.leading`, `shell.overlay` (list), `shell.quota-notice` (chain),
   `shell.leading`, `main` (keyed), `root`, `plugins.item`, `plugins.bundle.config` (keyed),
   `plugins.row.config` (keyed), `plugins.bundle.activation`, `plugins.detail.actions` (list),
   `plugins.detail.badge` (list), `plugins.detail.section` (list). Enumerating the complete set
   requires either reading every parent's `children:` table or inspecting the live page through the
   Cordis inspect provider (`dsh-cordis-client-runner/README.md:71` — "The Slots provider's exact
   `listSubTree` lookup").
9. **Registry/revision caveats** (`dsh-client-modules/README.md:130-134` **[V]**): revisions are
   derived from `mtimeMs`/`ctimeMs`/size, so a metadata-preserving content change will not reload a
   bundle; removing or replacing the modules bootstrap requires a page reload.
10. **`engines.dsh` / `dsh.manifestVersion` are inert** (`dsh-package-manifest/README.md:93` **[V]**).
    Declaring them gives no protection.
11. **Do not list a baseline module in `dsh.client.external`.** `dsh.client.external` "adds only
    exact non-baseline requests, each answered by the dynamic package row it names or an exact
    static-table key" (`dsh-client-modules/README.md:46` **[V]**), and
    `orderByModuleGraph` resolves each name against **package rows**, looking up
    `rowsById.get(name) ?? rowsById.get(stripClientSuffix(name))` (`lib/index.js:426-430` **[V]**).
    Listing `react` there yields no row and — per that same code — no error, so the entry is simply
    inert; but listing a **baseline package that also has a row** (e.g.
    `@deepseek-ai/dsh-client-ui-slots`, which is both a seed key and a package) is untested here.
    Baseline seeds need no declaration.
12. **`AccountDetails` is not a wire type.** The `{status:'ready', value, bonusWallets}` balance
    payload is; the `details` object the account settings page reads
    (`account.details?.balance`, `dsh-client-ui-settings-account/lib/client.js:1654`, `:2317`) is the
    page's own local view-model built at `:4250-4257`. A plugin should consume the Remote payload
    shape from §6.3, not an `AccountDetails` type.
13. **`remote.account` requires a signed-in account for a non-null payload.** `getBalance` returns
    `null` "when the account grant is absent or changed"
    (`dsh-api-account-controller/lib/types/index.js:101` **[V]**) — so `null` is a normal result, not
    an error, and must be handled alongside `{status:'failed'}`.
14. **No React `Suspense` / per-entry lazy loading in slot rendering.** "Slot rendering has no
    Suspense integration or per-entry lazy loading — the complete plugin roster settles before the
    renderer mounts the root" (`dsh-client-ui-renderer/README.md:95` **[V]**). A client plugin cannot
    defer its own UI behind `React.lazy`.
