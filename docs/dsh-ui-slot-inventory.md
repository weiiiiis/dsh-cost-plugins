# DSH Web Client — UI Slot Inventory & Balance-Badge Slot Recommendation

**Scope.** Every `dsh-client-ui-*` package plus `dsh-client-ui-slots`, `dsh-client-ui-renderer`,
`dsh-skill-badge` and `dsh-plugin-package-inventory-deepseek` shipped inside
`D:\deepseek\resources\app.asar`, as unpacked to `<scratch>/asar-out\`
(57 packages, log: `<scratch>/asar-extract-log.txt`).

**Method / evidence basis.**

- Extraction used the bundled Electron in `ELECTRON_RUN_AS_NODE=1` mode (`<scratch>/asar-extract-all.mjs`).
  The Electron process' stdout is not capturable from a piped PowerShell call in this sandbox, so the
  script writes its own log file (`COPIED n files: …` lines) that I then read.
- **There are no `.d.ts` files in the shipped packages** (extension histogram over the extract:
  `57 json, 57 yaml, 115 md, 118 js, 39 css, 3 woff2, 1 txt, 1 png`). Consequently the TypeScript
  `declare module '@deepseek-ai/dsh-client-ui-slots' { interface SlotMap { … } }` augmentations the task
  asks about **do not exist in the shipped artifact** — only their runtime residue does. The only
  `declare module` strings in the whole extract are in prose:
  `dsh-client-ui-workspace/README.md:120` (a doc example) and `dsh-client-ui-slots/README.md:56` / `README.zh.md:56`.
- The authoritative runtime declaration site is `children:` on a registration (or on a factory
  definition). `SlotCore.register()` throws unless the key already has a spec:
  > `if (!rec?.spec) throw new Error(\`slot "${options.name}" is not declared (a parent entry's children table must declare it)\`);`
  > — `dsh-client-ui-slots/lib/index.js:165`
  and declarations are created only from `options.children` (`…/lib/index.js:224-236`) or
  `registerFactory`'s `options.children` (`…/lib/index.js:104-114`), plus the one a-priori `'root'`
  spec seeded in the constructor (`…/lib/index.js:64-72`).
- So I enumerated slot keys by brace-matching every `children: { … }` object literal across all 118
  extracted `.js` files, then cross-checked against every `slots.inject("<key>")`, `slots.register(`,
  `renderSlot("<key>")` / `renderSlotChain("<key>")` and `renderFactorySlot("<key>")` occurrence.
  Result: **89 ordinary slot keys + 1 Component Factory (`conversation.content`) + the built-in `root`**.
  87 of the 89 ordinary keys are rendered by a literal `renderSlot("…")` call at the declaring package's
  own call site; the remaining two (`sidebar.right.pane.tab`, `sidebar.right.pane.tab.title`) are rendered
  through a dynamic-key dispatch (`renderSlot(seat, {}, { entryKey: … })`). Every `inject("<key>")` key in
  the extract resolves to a declared key, and every `renderSlot("<key>")` key other than `root` does too
  (0 orphans in either direction).

## 0. How the slot system actually works (necessary to read the table)

From `dsh-client-ui-slots/lib/index.js` and `dsh-client-ui-renderer/lib/client.js`:

| Concept | Evidence |
|---|---|
| Four kinds: `single`, `list`, `keyed`, `chain`; `single` = one occupant per `priority`; `list` = one occupant per `id`, ordered by `order`; `keyed` = one occupant per `key`; `chain` = entries elect themselves via `select(ownerProps)` in ascending `priority` | `dsh-client-ui-slots/lib/index.js:169-190`, `:278-293`; chain election `dsh-client-ui-renderer/lib/client.js:1158-1176` |
| Every slot also carries a `scope`: `root`, `session`, `session-maybe` | e.g. `dsh-client-ui-layout/lib/client.js:604-625` |
| **Declaring a slot = claiming it.** "the registering entry becomes the only entry allowed to render that key" | `dsh-client-ui-slots/README.md:46`; enforced at `dsh-client-ui-renderer/lib/client.js:331-333` (`SlotOwnershipError`) |
| Declaring and registering are different acts: the *declaring* entry lists the key in `children`; the *occupant* calls `ctx.slots.register({name: <key>, …})` | `dsh-client-ui-slots/README.md:28`, `:56` |
| `ctx.slots.inject(key, callback)` is the declaration-aware activation wrapper: it waits for the declaration, runs the callback when the declaration exists, disposes when the declaration collapses, and re-runs after restoration | `dsh-client-ui-renderer/lib/client.js:1343-1402`; documented `dsh-client-ui-workspace/README.md:163` |
| `ctx.slots.register` / `registerFactory` are wrapped in `ctx.effect`, i.e. owned by the caller's Cordis fiber | `dsh-client-ui-renderer/lib/client.js:1788-1795` |
| The `root` slot is the single ctx-level render entry; everything else renders through the injected props face | `dsh-client-ui-renderer/lib/client.js:1207-1235`, `:1506-1511` |
| Only `root` is rendered from `ctx`; child keys render via `renderSlot` given to the *declaring* entry's component | `dsh-client-ui-renderer/lib/client.js:329-343` |
| Occupant component props = `{…standardKit, …entry.inject(), …slotInject, …ownerProps}` (owner wins) | `dsh-client-ui-renderer/lib/client.js:752-777` |
| Other options accepted by `register`: `name`, `id`, `key`, `order`, `label`, `priority`, `locale`, `select`, `inject`, `children`, `store`, `registrant` | `dsh-client-ui-slots/lib/index.js:204-219` |

Because declaration and occupation are separate, **a third-party plugin cannot invent a new always-visible
region by itself** — it can only (a) occupy an already-declared slot, or (b) occupy a declared slot whose
component then declares *its own* children (which is exactly what `ui-chat` does with
`shell.overlay` → `shell.quota-notice`, see §2.4).

---

## 1. (a) Full slot inventory

Legend — **Kind/Scope** as declared. **Declared by** = the package whose `register()`/`registerFactory()`
`children` table declares the key (file:line of the `children` block). **Renders at** = the
`renderSlot()`/`renderSlotChain()` call site that mounts it. **Owner props** = the second argument of that
`renderSlot()` call (the last spread into the occupant, so owner props win over injected props).

### 1.1 Frame / global seats (declared by `@deepseek-ai/dsh-client-ui-layout`)

Declaring registration: `dsh-client-ui-layout/lib/client.js:601-627` — one `ctx.slots.register({name:"root", …})`
into the built-in `root`, declaring five children.

| Slot key | Kind | Scope | Declared by | Renders at | Owner props |
|---|---|---|---|---|---|
| `root` | single | root | built-in, `dsh-client-ui-slots/lib/index.js:64-72` | `dsh-client-ui-renderer/lib/client.js:1262` (`ctx.slots.renderSlot("root", {})`) | `{}` |
| `sidebar` | single | root | `dsh-client-ui-layout/lib/client.js:605` | `…/client.js:300` (inside `AppFrame`, `.sidebarCol`) | `{ collapsed, width }` |
| `main` | **keyed** | root | `dsh-client-ui-layout/lib/client.js:609` | `…/client.js:118` (`MainPanel`, center column) | `{}` + opts `{ entryKey: activePanelId ?? "conversation" }` |
| `rightbar` | single | root | `dsh-client-ui-layout/lib/client.js:613` | `…/client.js:338` (right track column) | `{ width, viewportWidth, canShow }` |
| `shell.overlay` | **list** | root | `dsh-client-ui-layout/lib/client.js:617` | `…/client.js:312` → `.overlayLayer` div at `…/client.js:343-347` | `{}` |
| `shell.leading` | single | root | `dsh-client-ui-layout/lib/client.js:621` | `…/client.js:313`, mounted **only** when `darwin && sidebarCollapsed` (`…/client.js:314, 348-355`) | `{}` |

Relevant CSS (extracted from the layout bundle's CSS module string):

```css
.BynINW_overlayLayer{z-index:20;pointer-events:none;position:absolute;inset:0}
.BynINW_overlayLayer>*{pointer-events:auto}
.BynINW_leadingSeat{z-index:15;-webkit-app-region:no-drag;align-items:center;display:flex;position:absolute;top:11px;left:88px}
.BynINW_frame{background:var(--dsw-alias-bg-base);grid-template-rows:100%;height:100%;display:grid;position:relative;overflow:hidden}
```

### 1.2 Left sidebar seats (declared by `@deepseek-ai/dsh-client-ui-sidebar`)

Declaring registration: `dsh-client-ui-sidebar/lib/client.js:487-521`. Layout order inside `SidebarRoot`
(`…/client.js:300-409`): top strip (darwin) → logo row (`sidebar.brand.mark` / `sidebar.brand.name`) →
New Session → `sidebar.panellist` panel list → `regionArea` (`sidebar.workspaces`) → `footArea`
(`sidebar.footer.action`, then `sidebar.settings`).

| Slot key | Kind | Scope | Declared by | Renders at | Owner props |
|---|---|---|---|---|---|
| `sidebar.brand.mark` | single | root | `dsh-client-ui-sidebar/lib/client.js:491` | `…/client.js:315` (expanded) and `:279` (collapsed rail) | `{ size: 24 }` (+ `{fallback: FishLogo}`) |
| `sidebar.brand.name` | single | root | `dsh-client-ui-sidebar/lib/client.js:495` | `…/client.js:318` | `{}` (+ fallback: build label/version badge) |
| `sidebar.toggle.badge` | single | root | `dsh-client-ui-sidebar/lib/client.js:499` | `…/client.js:285` | `{}` — **only rendered while `!wide` (collapsed)** |
| `sidebar.panellist` | list | root | `dsh-client-ui-sidebar/lib/client.js:503` | `…/client.js:190` (`PanelRow`) | `{ size: wide ? 16 : 18, active }`, opts `{ only: id }` |
| `sidebar.workspaces` | single | root | `dsh-client-ui-sidebar/lib/client.js:507` | `…/client.js:392` (`regionArea`) | `{ wide, expandSidebar }` |
| `sidebar.settings` | single | root | `dsh-client-ui-sidebar/lib/client.js:511` | `…/client.js:406` (`settingsArea`, bottom-pinned) | `{ wide }` |
| `sidebar.footer.action` | **list** | root | `dsh-client-ui-sidebar/lib/client.js:515` | `…/client.js:403` (`footerActions`, above Settings) | `{ wide }` |

Sidebar README (`dsh-client-ui-sidebar/README.md:30, 36-38, 44, 46, 70`) confirms the intent:
> "The sidebar is the navigation shell: … Feature plugins fill its seats — ui-workspace fills
> `sidebar.workspaces`, ui-settings registers the trigger row and settings panel at `sidebar.settings`."
> "Plugins add an icon component to the root-scoped `sidebar.panellist` list with an `id`, optional `order`…"
> "The top expand button hosts the optional, non-interactive `sidebar.toggle.badge` slot while collapsed."
> "The foot is the `sidebar.settings` seat…"

### 1.3 Sidebar session/workspace rows (declared by `@deepseek-ai/dsh-client-ui-workspace`)

Declared at `dsh-client-ui-workspace/lib/client.js:4299-4323` and `:4398-4402`.

| Slot key | Kind | Scope | Renders at | Owner props |
|---|---|---|---|---|
| `sidebar.workspaces.directoryFlow` | single | root | `…/client.js:3216` | `owner` (directory-picker flow) |
| `sidebar.workspaces.session.menu.item` | list | root | `…/client.js:1661` | row/menu owner (`{ sessionId, … }`) |
| `sidebar.workspaces.session.row.action` | list | root | `…/client.js:1665` | row owner |
| `sidebar.session.row.leading` | list | root | `…/client.js:1623` | `{ sessionId }` |
| `sidebar.session.row.hover` | list | root | `…/client.js:1472` | `{ sessionId }` |
| `conversation.hero.workspace.directoryFlow` | single | root | `…/client.js:2028` | `owner` |

### 1.4 Settings / launcher seats (declared by `@deepseek-ai/dsh-client-ui-settings-general`)

The Settings provider registers into `sidebar.settings` and declares its own children —
`dsh-client-ui-settings-general/lib/client.js:1058-1146` (the `settings.launcher`/`settings.trigger`/… block).

| Slot key | Kind | Scope | Renders at | Owner props |
|---|---|---|---|---|
| `settings.launcher` | single | root | `…/client.js:435` | `{ wide, settingsOpen, openSettings, settingsShortcut? }` |
| `settings.trigger` | single | root | `…/client.js:461` | `{ wide }` |
| `settings.header` | single | root | `…/client.js:302` | `{}` |
| `settings.action` | list | root | `…/client.js:325` | `{}` |
| `settings.close` | single | root | `…/client.js:332` | `{}` |
| `settings.section` | list | root | `…/client.js:337` | `{ close: onClose }`, opts `{ only: active }` |
| `settings.onboarding` | list | root | `…/client.js:489` | `{ stepId, explicit, complete, … }` |
| `settings.general.item` | list | root | `…/client.js:638` | `{}` |
| `settings.plugins.tab` | list | root (declared `dsh-client-ui-settings-plugins/lib/client.js:208`) | `dsh-client-ui-settings-plugins/lib/client.js:68, 124` | `{}`, opts `{ only: id }` |
| `settings.models.provider-card` | keyed | root (declared `dsh-client-ui-settings-models/lib/client.js:4064`) | `…/client.js:2150, 2215, 2319` | `{ provider, configured, keyConfigured }`, opts `{ entryKey: settingsNs }` |
| `settings.models.footer` | list | root (`…/client.js:4068`) | `…/client.js:2368` | `{}` |
| `settings.models.sign-in` | single | root (`…/client.js:4083`) | `…/client.js:2560` | `{ complete, useApiKey, … }` |
| `plugins.item` | list | root (declared `dsh-client-ui-plugin-manager/lib/client.js:3725`) | `dsh-client-ui-plugin-manager/lib/client.js:2266, 2322, 2330` | `{ view: "summary" \| "page", form? }`, opts `{ only: rowId }` |
| `plugins.row.config` | keyed | root (`…/client.js:3737`) | `…/client.js:2390, 2401` | `{ view, form? }`, opts `{ entryKey }` |
| `plugins.detail.actions` | list | root (`…/client.js:3741`) | `…/client.js:2309, 2367, 2436` | `{ subject }` |
| `plugins.detail.badge` | list | root (`…/client.js:3745`) | `…/client.js:2319, 2378, 2482` | `{ subject }` |
| `plugins.detail.section` | list | root (`…/client.js:3749`) | `…/client.js:2334, 2404, 2534` | `{ subject }` |
| `plugins.bundle.config` | keyed | root (`…/client.js:3733`) | `…/client.js:2522` | `{ view: "page" }`, opts `{ entryKey: pkg.name }` |
| `plugins.bundle.activation` | keyed | root (`…/client.js:3729`) | `…/client.js:3569` | `{ packageName, onDismiss }` |

### 1.5 Conversation / chat seats (`session` and `session-maybe` scope)

`conversation.content` is a **Component Factory** (`SlotFactoryMap`), not an ordinary slot:
`dsh-client-ui-conversation/lib/client.js:18150-18187` — `slots.registerFactory({name:"conversation.content",
scope:"session-maybe", children:{…}, slots:{ views:{scope:"session"}, widthControls:{scope:"root"} }, …})`.
It is rendered via `renderFactorySlot("conversation.content", …)`
(`dsh-client-ui-conversation/lib/client.js:16021`; consumer example `dsh-client-ui-subagent/lib/client.js:782`).

| Slot key | Kind | Scope | Declared by (file:line) | Renders at | Owner props |
|---|---|---|---|---|---|
| `main.conversation` | single | session-maybe | conversation `:18436` | conversation `:16354` | `{}` |
| `conversation.header` | single | session-maybe | conversation `:18146` | conversation `:16021` | `{}` |
| `conversation.header.leading` | single | root | conversation `:18250` | conversation `:16374` | `{}` |
| `conversation.session` | single | session | conversation `:18155` | conversation `:16202`; subagent `:772` (`{view:"chat"}`) | `{}` |
| `conversation.session.header` | single | session | conversation `:18254` | conversation `:16375` | `{ hideChrome: blank }` |
| `conversation.session.header.lineage` | single | session | conversation `:18264` | conversation `:16494` | lineage owner, opts `{fallback: title\|null}` |
| `conversation.session.header.actions` | list | session | conversation `:18268` | conversation `:16502` | `{}` |
| `conversation.session.header.utilities` | list | session | conversation `:18272` | conversation `:16506` | `{}` |
| `conversation.session.header.corner` | single | session | conversation `:18276` | conversation `:16510` | `{}` |
| `conversation.composer` | **chain** | session | conversation `:18159` | conversation `:16313` (`renderSlotChain`) | composer owner props |
| `conversation.composer.bar` | single | session-maybe | conversation `:18163` | conversation `:16287` | `{ variant:"hero"\|"composer", disabled?, placeholder?, workspacePickerOpen, onRequestWorkspace, … }` |
| `conversation.input.dock` | list | session | conversation `:18167` | conversation `:16309` | `zone` |
| `conversation.input.attachments` | single | session-maybe | conversation `:18297` | conversation `:17458` | `{ attachments, canAcceptDrop, onAddFiles, onRemoveAttachment }` |
| `conversation.input.overlay` | list | session | conversation `:18301` | conversation `:17452` | `{}` |
| `conversation.input.permission` | single | session | conversation `:18305` | conversation `:17522` | `{ locked }` |
| `conversation.input.plan` | single | session | conversation `:18313` | conversation `:17522` | `{ locked }` |
| `conversation.input.left` | list | session | conversation `:18309` | conversation `:17524` | `{}` |
| `conversation.input.right` | list | session | conversation `:18317` | conversation `:17532` | `{}` |
| `conversation.input.model` | single | session | conversation `:18321` | conversation `:17532` | `{ locked: modelSeatLocked }` |
| `conversation.input.activity` | single | session | conversation `:18325` | conversation `:17536` | `{ locked, onActiveChange }` |
| `conversation.composer.dock` | list | session | conversation `:18329` | conversation `:17615` | `{}` |
| `conversation.view` | list | session | conversation `:18208` | conversation `:16415` (`{ only: viewId }`); trajectory `:8736` | `{ inspectCall, viewRequest, openView, completeViewRequest }` |
| `conversation.chat.node` | keyed | session | chat `:12396` | chat `:1770` | `routedOwner`, opts `{ entryKey: routedNode.kind, hookContext, fallback }` |
| `conversation.chat.commandview` | keyed | session | chat `:6813` | chat `:6139` | `owner`, opts `{ entryKey: command.name }` |
| `conversation.chat.turnTail` | list | session | chat `:6854` | chat `:6580` | `{ turn, seq, openFile }` |
| `conversation.chat.assistant-actions` | list | session | chat `:6858` | chat `:6591` | `{ messageId }` |
| `conversation.message.images` | single | session | chat `:12401` | chat `:5214` | `{ …owner, loadImage }` |
| `conversation.trajectory.images` | single | session | trajectory `:8742` | trajectory `:8324` | `{ …owner, loadImage }` |
| `conversation.hero.brand.mark` | single | root | conversation `:18171` | conversation `:16184` | `{ size: 34, className }`, `{fallback: HeroFish}` |
| `conversation.hero.workspace` | single | root | conversation `:18175` | conversation `:16268` | `{ open, anchorRef, selectedId, onPick, … }` |
| `conversation.hero.agentPreset` | single | session-maybe | conversation `:18179` | conversation `:16283` | `{}` |
| `conversation.approval.detail` | single | session | approval `:350` | approval `:40` | `{ callId: approval.callId }` |
| `conversation.plan-review.actions` | list | session | user-questions `:1916` | user-questions `:557` | plan-review owner |
| `deliverables.file.actions` | list | session | deliverables `:2269` | deliverables `:1702` | `{ actionUrl, … }` |
| `deliverables.review.file.actions` | list | session | deliverables `:2303` | deliverables `:1963` | `{ actionUrl, … }` |
| `tool.call.images` | single | session | tool `:2872` | tool `:1618` | `{ images, loadImage, align }` |
| `tool.call.toolview` | **keyed** | session | tool `:4556` | tool `:1863` | `owner`, opts `{ entryKey: toolName, hookContext, fallback }` |
| `tool.view.cordis` | keyed | session | cordis `:1456` | cordis `:612` | tool-view owner |
| `sidebar.chat.conversation` | single | session | subagent `:822` | subagent `:797` | `{}` |

### 1.6 Right rail / `sidebar-right` seats

| Slot key | Kind | Scope | Declared by | Renders at | Owner props |
|---|---|---|---|---|---|
| `rightbar.session` | single | session | sidebar-right `:9140` | sidebar-right `:5858` | Session seat owner |
| `sidebar.right.pane.tab` | **keyed** | session | sidebar-right `:9153` | sidebar-right `:5550` **dynamic** (`renderSlot(seat, {}, { entryKey: definition?.id ?? tab.kind, fallback, hookContext })`) | `{}` + `hookContext`; occupants read `useTabInfo()` |
| `sidebar.right.pane.tab.title` | **keyed** | session | sidebar-right `:9158` | sidebar-right `:5550/5555` (same dynamic dispatch) | as above |
| `sidebar.right.tab.menu.item` | list | session | sidebar-right `:9163` | sidebar-right `:5699` | tab/dismiss owner |
| `sidebar.right.tab.guide` | **chain** | session | sidebar-right `:9208` | sidebar-right `:510` (`renderSlotChain`) | `{}` + `{ hookContext: useTabInfo }` |
| `sidebar.right.tab.guide.entry` | keyed | session | sidebar-right `:9203` | sidebar-right `:517` | `{ entryId, kind, title, … }` |
| `sidebar.right.tab.document` | keyed | session | sidebar-documentpreview `:6828` | sidebar-documentpreview `:971` | `{ resourceAddress, content, wrap, scrollportRef, addResource, setResources }` |
| `sidebar.right.tab.document.action` | keyed | session | sidebar-documentpreview `:6841` | sidebar-documentpreview `:915` | `{ content }`, `{ entryKey: selected.id }` |
| `sidebar.right.tab.document.actions` | list | session | sidebar-documentpreview `:6833` | sidebar-documentpreview `:798, 953` | `fileOwner` |
| `sidebar.right.tab.document.unpreviewable` | list | session | sidebar-documentpreview `:6837` | sidebar-documentpreview `:815, 1009` | `fileOwner` |
| `sidebar.right.tab.document.office.pdf` | keyed | session | sidebar-documentpreview `:5681` | sidebar-documentpreview `:5400` | `{ resourceAddress, content, wrap, scrollportRef, … }` |
| `sidebar.right.tab.files.actions` | list | session | sidebar-files `:1009` | sidebar-files `:699` | `{ absolutePath }` |

### 1.7 Declared extension seats with **no shipped occupant** (free, additive)

Checking every declared key against `name: "<key>"` registration occurrences and `inject("<key>")`:

`conversation.chat.commandview` (keyed), `conversation.header.leading` (single),
`conversation.hero.brand.mark` (single), `conversation.input.left` (list), `conversation.input.right` (list),
`plugins.detail.actions` (list), `plugins.detail.badge` (list), `plugins.detail.section` (list),
`plugins.row.config` (keyed), `settings.models.footer` (list), `settings.models.provider-card` (keyed),
`sidebar.right.tab.guide` (chain), `sidebar.right.tab.menu.item` (list), `tool.view.cordis` (keyed).

Note `shell.overlay` and `sidebar.footer.action` are **not** in this list — they are already multi-occupant
`list` slots, which is precisely what makes them the right targets for an additive badge.

---

## 2. (b) Ranked recommendations for an always-visible, global balance badge

Requirement recap: *always visible*, *global*, *not tied to a session*, *not tied to the Settings page*.

### 2.1 Rank 1 — `shell.overlay` (list, root) — **recommended**

**Why it wins**

- Rendered unconditionally by the shell on every frame, regardless of session, panel, sidebar or Settings:
  `const overlays = React.useMemo(() => renderSlot("shell.overlay", {}), [renderSlot]);`
  — `dsh-client-ui-layout/lib/client.js:312`, placed into the frame at `…/client.js:343-347`.
- `root` scope: no session identity is required and the entry mounts once, not per session.
- `list` kind: additive and collision-free as long as the `id` is unique — 10 shipped entries already
  share it (`chat.quota-notice`, `plugin-manager.refresh-toast`, `schedule.delete-toast`, `shortcuts`,
  `workspace.session-rename`, `workspace.session-archive`, `workspace.row-toast`,
  `session-log-upload-toast`, `desktop-onboarding`, `account.platform-page`).
- It gives a genuinely free-floating surface: the layer is `position:absolute; inset:0` with
  `pointer-events:none` and children `pointer-events:auto`, so an occupant may place itself anywhere with
  `position:fixed` (the frame is `position:relative; overflow:hidden`, but no ancestor establishes a
  containing block via `transform`/`filter`, so a fixed-position child escapes the clip — this is exactly
  how the shipped quota-notice Toast behaves).
- No `single`-slot occupant conflict, no session provider needed, no Settings provider needed.

**Ranking penalty / risk:** the layer's stacking context is `z-index: 20`, so the badge is drawn **below**
every modal (`Modal.module.css .root{z-index:1000}`, settings overlay `z-index:1000`, image lightbox
`z-index:1000`, Platform page overlay `z-index:1001`), below toasts/menus/tooltips (`z-index:1100`) and
below the Windows caption controls (sidebar toggle/New Session are `position:fixed; z-index:30`). A
`position:fixed` child inside `.overlayLayer` cannot escape that stacking context, because z-index:20 on a
positioned element forms one. See §4.

**Registration call** (list ⇒ `id` is mandatory, `key` is an error):

```js
const NS = 'acme.account'

ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'acme-account: dictionaries')

ctx.slots.inject('shell.overlay', () => ctx.slots.register({
  name: 'shell.overlay',
  id: 'acme.balance-badge',        // REQUIRED for a list slot
  order: 100,                      // display order among the list's entries
  locale: NS,                      // gives the component a `t` prop bound to NS
  inject: () => ({
    hooks: { account: accountSnapshotSource },   // becomes `useAccount` in props
    openTopUp: () => { /* … */ },
  }),
}, BalanceBadge))
```

The component then renders its own anchored element, e.g.
`<button style={{ position:'fixed', right:12, bottom:12, zIndex:1 }}>¥12.34</button>`.

**Evidence for the option surface** — real shipped call using the same shape
(`dsh-client-ui-chat/lib/client.js:12473-12496`):

```js
ctx.slots.inject("shell.overlay", () => ctx.slots.register({
  name: "shell.overlay",
  id: "chat.quota-notice",
  locale: NS,
  children: { "shell.quota-notice": { kind: "chain", scope: "root" } },
  inject: () => ({ hooks: { notice: quotaNotice }, dismissNotice: …, keepNoticeOpen: … })
}, QuotaNoticeHost));
```

### 2.2 Rank 2 — `sidebar.footer.action` (list, root)

**Why it is attractive**

- Purpose-built bottom-pinned action strip directly above the Settings row in the left sidebar, and a
  `list`, so it is additive. Declared `dsh-client-ui-sidebar/lib/client.js:515-518`; rendered at
  `…/client.js:403` as `children: renderSlot("sidebar.footer.action", { wide })` inside
  `.footArea > .footerActions` (`…/client.js:399-408`).
- Owner prop is just `{ wide }` (`wide === !collapsed`), which a badge can use to switch between a full
  `¥12.34` label and a compact glyph.
- Real shipped precedent: `dsh-client-ui-cordis/lib/client.js:1411-1441`
  (`ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({ name:"sidebar.footer.action", id:"cordis-panel", … }, CordisPanel))`).

**Why it is only Rank 2 — it is not always visible**

- On **Windows Electron** (this machine: `[data-windows-titlebar]` is set by the desktop preload) a
  collapsed sidebar removes the entire footer:
  ```css
  [data-windows-titlebar] ._2H3hWW_collapsed ._2H3hWW_panelList,
  [data-windows-titlebar] ._2H3hWW_collapsed ._2H3hWW_regionArea,
  [data-windows-titlebar] ._2H3hWW_collapsed ._2H3hWW_footArea{display:none}
  ```
  (`dsh-client-ui-sidebar/lib/client.js:91`, CSS module string for `SidebarRoot.module.css`.)
- On **macOS desktop** the sidebar column is hidden entirely when collapsed
  (`dsh-client-ui-layout/README.md:37`, `dsh-client-ui-sidebar/README.md:52`).
- On plain Web with the sidebar collapsed to the 56px rail the strip remains mounted (the CSS above is
  scoped to `[data-windows-titlebar]`), but the bottom-pinned seat there fades rather than translating:
  *"The bottom-pinned `sidebar.settings` control shares the fade timing but has no horizontal
  translation."* — `dsh-client-ui-sidebar/README.md:46`.

**Registration call:**

```js
ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
  name: 'sidebar.footer.action',
  id: 'acme.balance-badge',   // REQUIRED for a list slot
  order: 10,
  locale: NS,
  inject: () => ({ hooks: { account: accountSnapshotSource } }),
}, SidebarBalanceBadge))    // receives { wide } as an owner prop
```

### 2.3 Rank 3 — `main` (keyed, root): a full global panel, **not a badge**

`main` is a root-scoped `keyed` slot (`dsh-client-ui-layout/lib/client.js:609-612`) rendered in the centre
column with `opts.entryKey = activePanelId ?? "conversation"` (`…/client.js:118`). A plugin can register a
new panel key (e.g. `key: "account"`) and expose it in `sidebar.panellist` with the same `id` — that is the
supported "global panel" mechanism:

> "Global panels occupy the root-scoped `main` keyed slot; `conversation` is the reserved key for the
> Conversation. `ctx.layout.selectPanel(id)` selects a registered panel… No global panel is registered by
> the shipped composition." — `dsh-client-ui-layout/README.md:32`

But the centre column renders only the **selected** panel, so this is a whole-page surface, not an
always-visible widget. Ranked 3rd only because it is the cleanest fully-supported "global, session-free"
region; it fails "always visible" for a badge.

### 2.4 Rank 4 — `shell.quota-notice` (chain, root): the only *designed* account-balance surface

Declared by `dsh-client-ui-chat/lib/client.js:12477-12480` as a `chain`, root scope, and rendered by the
chat host at `dsh-client-ui-chat/lib/client.js:11005` (`function QuotaNoticeHost`), which calls
`renderSlotChain("shell.quota-notice", owner, { fallback: <Toast …> })` at `dsh-client-ui-chat/lib/client.js:11014`. The `list`-entry `shell.overlay` host offers
each live notice to the chain; entries elect themselves with `select(ownerProps)`.

The **account package already occupies this seat** for quota failures
(`dsh-client-ui-settings-account/lib/client.js:4474-4485`):

```js
ctx.slots.inject("shell.quota-notice", () => ctx.slots.register({
  name: "shell.quota-notice",
  locale: "settings.account",
  select: (owner) => owner.code === "ACCOUNT_QUOTA" ? owner : null,
  inject: () => ({ hooks: { account: operations.hooks.account, platformPage: platformPages }, … })
}, AccountQuotaNotice));
```

This is a *transient notice* surface (Modal/Toast, newest-notice replacement, `keepOpen()` holds), not a
persistent badge. It is nonetheless the highest-signal precedent that this codebase models account balance
state and already renders it frame-wide outside Settings. A balance badge could either (a) piggyback on
this chain with its own `select`, or (b) more appropriately register its own `shell.overlay` entry as in
§2.1. Note `select` forces chain semantics: an entry must elect or decline on every render.

### 2.5 Rank 5 (rejected) — candidates that cannot work

| Candidate | Why rejected |
|---|---|
| `sidebar.settings`, `settings.launcher`, `settings.trigger`, `settings.close`, `settings.header` | `single` kind **and already occupied** — `SlotCore.register` throws `single slot "…" already has a registration at priority 0 … register at a different priority to shadow it` (`dsh-client-ui-slots/lib/index.js:170-174`). Shadowing would *replace* the shipped Settings control, not add to it. |
| `sidebar.brand.mark` / `sidebar.brand.name` | `single`, occupied by `dsh-client-ui-brand-official/lib/client.js:37-38`; reusing them deletes the brand identity/version badge. |
| `sidebar.toggle.badge` | `single`, occupied by `DesktopUpdateBadge` (`dsh-client-ui-settings-general/lib/client.js:983-990`), and rendered **only while collapsed** (`dsh-client-ui-sidebar/lib/client.js:285`). |
| `shell.leading` | `single`, occupied by `HeaderLeadingControls` (`dsh-client-ui-sidebar/lib/client.js:522-526`), and mounted only when `darwin && sidebarCollapsed` (`dsh-client-ui-layout/lib/client.js:314`). **macOS only — unusable on Windows.** |
| Windows caption / title bar | **No slot exists.** The Windows chrome is the Desktop-owned `[data-windows-titlebar]` strip: `AppFrame:before` is the drag region, and the sidebar's toggle/New Session are `position:fixed` into it (`z-index:30`), with menus positioned from `--dsh-windows-menu-start`. None of the 89 declared keys targets it. |
| A status bar | **No slot exists.** The only `*footer*` keys are `sidebar.footer.action` and the settings-scoped `settings.models.footer`. |
| Any `conversation.*` / `tool.*` / `deliverables.*` / `sidebar.right.*` key | All `session` / `session-maybe` scope — fails "not tied to a session". |
| `settings.section`, `settings.action`, `settings.general.item`, `settings.plugins.tab`, `settings.onboarding`, `settings.models.*`, `plugins.*` | Root scope but rendered only inside the Settings modal / plugin-manager page — "tied to settings". |

### 2.6 Bottom line for question 5

> **A suitable slot already exists for "always visible, global, not tied to a session, not tied to
> settings": `shell.overlay`.** It is the single root-scoped, frame-wide, always-mounted, additive
> (`list`) region in the shipped composition, and the shipped code already uses it for frame-wide
> cross-session chrome (quota notices, toasts, dialogs, the Platform page host). The second-best existing
> seat, `sidebar.footer.action`, is additive and visually better placed but disappears with a collapsed
> sidebar on Windows/macOS-desktop. Everything else is either `single`+occupied, session-scoped, or
> Settings-scoped. There is **no** status-bar slot and **no** Windows-caption slot.

---

## 3. (c) Findings from items 6 and 7

### 3.1 Item 6 — Does any shipped plugin already show balance/usage persistently outside Settings?

**No persistent balance display exists outside the Settings page.** Full evidence:

| Search term | Occurrences (all packages) | Where |
|---|---|---|
| `formatBalance` | 3 (1 definition + 2 calls) | `dsh-client-ui-settings-account/lib/client.js:2256` (def), `:2463`, `:2475` (calls) |
| `getBalance` | 1 | `dsh-client-ui-settings-account/lib/client.js:4263` — `const result = await ctx.remote.account.getBalance(client())` |
| `bonusWallets` | 3 | `dsh-client-ui-settings-account/lib/client.js:2318`, `:2475`, `:3018` (`hasOnboardingCredit`) |
| `balance` (excluding false positives in the bundled PDF/Excel previewers, `dsh-client-ui-sidebar-documentpreview/lib/client.pdf.js:487`, `client.excel.js:32474…`) | all in `dsh-client-ui-settings-account/lib/client.js` | `:2317-2319`, `:2457-2479` (AccountSection card), `:3017-3018`, `:3953-3954`, `:4262-4264` |

The formatter, quoted verbatim (`dsh-client-ui-settings-account/lib/client.js:2256-2262`):

```js
function formatBalance(amount, symbol) {
  const value = new Big(amount);
  if (value.eq(0)) return `${symbol}0.00`;
  if (value.lt(0)) return `-${symbol}${value.gt(-.01) ? "0.01" : addCommas(value.abs().toFixed(2))}`;
  if (value.lt("0.01")) return `<${symbol}0.01`;
  return `${symbol}${addCommas(value.round(2, Big.roundDown).toFixed(2))}`;
}
```

and its only render sites, inside the Account settings section card
(`dsh-client-ui-settings-account/lib/client.js:2457-2479`):

```js
className: AccountSection_module_css_default.balanceCard,
…
children: [(0, react_jsx_runtime.jsx)("span", { children: t("balance") }),
  signedIn && wallets !== void 0 && wallets.length > 0 ? (… wallets.map((wallet) =>
    (0, react_jsx_runtime.jsx)("span", { children: formatBalance(wallet.balance, wallet.currency === "CNY" ? "¥" : "$") }, wallet.currency)) …)
  : …]
```

**Outside Settings there are exactly two account surfaces, neither of which is a balance badge:**

1. **Unnotified-bonus card above the sidebar account launcher** — one-shot, server-authored, never polls:
   > "A granted bonus appears as a server-authored notice above the sidebar account launcher without
   > taking focus. The client reads the unnotified bonus when an account becomes active and once per
   > Settings entry; it never polls." — `dsh-client-ui-settings-account/README.md:53`
   It occupies the `settings.launcher` *single* seat (registered at `dsh-client-ui-settings-account/lib/client.js:4496-4500`,
   declared by `dsh-client-ui-settings-general/lib/client.js:1116-1119`), i.e. it lives inside the left
   sidebar's Settings launcher area — gone when Settings/sidebar goes away, and it displays a bonus
   announcement, not the balance.
2. **`shell.quota-notice` chain entry for `ACCOUNT_QUOTA`** — §2.4. Modal/Toast on failure only:
   > "Chat offers each live quota failure from a bound Session to the frame-wide `shell.quota-notice`
   > chain from its host in `shell.overlay`, so the notice outlives the Chat panel that reported it."
   > — `dsh-client-ui-settings-account/README.md:41`

**The nearest thing to a persistent usage readout is session-scoped, not account-scoped:**

- `StatsPills` — `dsh-client-ui-chat/lib/client.js:7130-7178`, registered into `conversation.composer.dock`
  with `id: "stats"`, `order: 0` (`…/client.js:12497-12503`). It reads `useProjection("tokenUsage")` and
  `useProjection("sessionStats")` and renders decode speed / cache-hit % / token counts
  (`t("message.tokensPerSecond")`, `t("stats.cacheHit")`) — per-session token metering, not currency.
  `conversation.composer.dock` is `session` scope.
- `ContextMeter` — `dsh-client-ui-conversation/lib/client.js:16997+`, context occupancy % from
  `useProjection("contextPressure")`; rendered in the composer bar at `…/client.js:17612-17615`, also
  session-scoped.

**Conclusion for item 6:** a persistent, always-visible **balance** badge does not exist; `formatBalance`
and the balance data path (`ctx.remote.account.getBalance` → `details.balance.value` /
`bonusWallets[].balance`) are already available and reusable, but they are currently consumed only by the
Settings Account section, the one-shot bonus notice, and the `ACCOUNT_QUOTA` notice.

### 3.2 Item 7 — `@deepseek-ai/dsh-plugin-package-inventory-deepseek`

**It is not a plugin catalog / registry list, and it contains no UI at all.** It is a **host-side
(function plugin) request-metadata provider** for official DeepSeek LLM API requests.

- `README.md:12` (Summary): *"Complete active Loader-backed plugin package inventory for official DeepSeek
  LLM API requests. This function plugin injects the Loader, live Agent registry, and
  `ctx.deepseekLlmApiExtensions`, then owns the `dsh_plugin_packages` field."*
- `package.json:3`: `"description": "Active Loader-backed plugin package inventory for official DeepSeek
  LLM API requests"`; `"type": "module"`, `"main": "lib/index.js"`; **no client/browser entry**.
- `lib/index.js:17-21`: `const inject = ["agents", "deepseekLlmApiExtensions", "loader"]`.
- `lib/index.js:133-143` — the whole plugin body:

```js
function apply(ctx, config) {
  if (config.enabled === false) return;
  const hostBaseUrl = ctx.baseUrl ?? import.meta.url;
  const resolver = new PackageIdentityResolver(hostBaseUrl, ctx.get("pluginPackages"));
  ctx.deepseekLlmApiExtensions.register("dsh_plugin_packages", { prepare: async (request) => {
    return { value: {
      version: 1,
      packages: await collectActivePluginPackages(ctx, resolver, hostBaseUrl, request.sessionId)
    } };
  } });
}
```

- Wire shape (`README.md:42`): *"The version-1 `dsh_plugin_packages` field contains only
  `{ name, version }` pairs."*
- Configuration (`README.md:29`, `lib/index.js:23`): `enabled` boolean, default `true`.
- Model visibility (`README.md:49-51`): *"Nothing. `dsh_plugin_packages` is provider metadata outside the
  model's messages, system prompt, and tool schemas."*

**Entries related to balance, usage, or account widgets: none.** `grep` over the package for
`balance|quota|usage|account|widget` returns nothing; the only identities it emits are npm
`{name, version}` pairs of *active Loader entries* — the packages that happen to be loaded, including
`@deepseek-ai/dsh-client-ui-settings-account` — with no curation, description, or UI hook.

For completeness: the *UI* surfaces that render plugin/package inventory lists are different packages —
`dsh-client-ui-settings-plugin-inventory` (registers `settings.plugins.tab`,
`lib/client.js:792`) and `dsh-client-ui-plugin-manager` (declares `plugins.*`, `lib/client.js:3724-3752`),
backed by the host-side `dsh-host-plugin-inventory`. None of these is a curated downloadable-plugin
catalog either, and none has balance/usage/account entries.

Also extracted and reported as requested: `@deepseek-ai/dsh-skill-badge` is **not UI-related** — it is an
optional, default-disabled *skill provider* that adds the `dsh-badge` ("powered by dsh" attribution) skill
to the session skill catalog (`dsh-skill-badge/README.md:12, 28-42`; ships `assets/dsh-badge.md` and
`assets/dsh-badge.png`). It declares no slots and references no balance data.

---

## 4. (d) Known unknowns / risks

1. **No `.d.ts` in the shipped artifact ⇒ the `SlotMap` type layer is unverifiable here.** All claims in §1
   are runtime-only (from `children:` tables and `register`/`inject`/`renderSlot` call sites). The
   TypeScript `declare module … interface SlotMap` augmentations the task describes exist only in source
   form upstream (`dsh-client-ui-slots/README.md:56` asserts *"`SlotMap` is declared empty here and merged
   by consumers via `declare module` augmentation"*). **Risk:** the compiler-visible key set cannot be
   listed from this artifact; a key could in principle be type-declared but never runtime-declared (the
   reverse of what I enumerated). I found no evidence of that: 0 `inject()` keys and 0 non-`root`
   `renderSlot()` keys are missing from the declared set.
2. **Minified/bundled sources.** `lib/client.js` bundles are build output; line numbers are exact for this
   asar but will not match upstream `src/`. Class names appear as CSS-module hashes (`_2H3hWW_footArea`,
   `BynINW_overlayLayer`), which are build artifacts.
3. **Stacking: a `shell.overlay` badge is occluded by every modal.** `.overlayLayer` is `z-index:20` and
   creates a stacking context, so a child cannot be raised above `Modal` (`z-index:1000`), the Settings
   overlay (`z-index:1000`), the image lightbox (`z-index:1000`), the account Platform page host
   (`z-index:1001`), toasts/menus/tooltips (`z-index:1100`), or the Windows caption controls
   (`z-index:30`). If "always visible" must include *while the Settings modal is open*, the slot system
   cannot deliver it from `shell.overlay`; the alternatives are (a) accept occlusion, (b) render a
   `position:fixed` element from a plugin effect directly onto `document.body` with `z-index > 1000`
   (outside the slot system — no shipped precedent; the closest is
   `dsh-client-ui-chat/lib/client.js:7091` `(0, react_dom.createPortal)(…)` … `}), document.body)]` at
   `:7127`, a React portal used inside the chat stats dialog), or
   (c) ask upstream for a higher-layer slot. On Windows the caption controls (z 30) sit above the badge,
   which matters for a top-right placement — prefer a bottom-corner anchor.
4. **No slot is guaranteed against future occupant conflicts for `single` kinds.** If this work later
   needs a *dedicated* always-visible seat, the correct upstream shape is a new declared key (e.g.
   `shell.status`) added to `dsh-client-ui-layout/lib/client.js:604-625`'s `children` table plus a render
   site in `AppFrame` — otherwise a third-party plugin cannot render it at all
   (`dsh-client-ui-slots/lib/index.js:165`).
5. **`shell.overlay` order semantics.** `list` entries sort by `priority` then `order`
   (`dsh-client-ui-slots/lib/index.js:221`), and `entriesOfSlot` keeps one winner per `id`
   (`…/index.js:278-293`). Two plugins registering the same `id` at the same `priority` make the *second*
   `register` throw (`…/index.js:184`). The badge's `id` must be namespaced.
6. **`shell.overlay` occupant count is a de-facto contract, not a limit.** 10 entries already share the
   layer; several are full-viewport dialogs (`workspace.session-rename`, `shortcuts`, `desktop-onboarding`,
   `account.platform-page`). Adding an always-mounted badge increases the always-mounted React tree; there
   is no documented budget for that.
7. **Data availability is Desktop-gated in the shipped account plugin.**
   `dsh-client-ui-settings-account/lib/client.js:4434` gates its extra registrations on
   `if ("dshDesktop" in globalThis)`, and `README.md:29` states *"The client activates only inside Desktop,
   identified by its preload bridge. Plain Web clients keep the standard Settings launcher and API-key
   onboarding without account login, account settings, or an account-state subscription."* A balance badge
   must therefore either live in the Desktop-only branch or explicitly degrade on plain Web (signed-out /
   unavailable state), and it needs the account Remote namespace (`ctx.remote.account.getBalance`, used at
   `…/client.js:4263`) plus the account token — which the renderer/renderer-commands deliberately never
   receive (`README.md:39`: *"renderer commands never receive the account token"*).
8. **Balance freshness is explicit-read, not polled.** The shipped client reads the unnotified bonus "when
   an account becomes active and once per Settings entry; it never polls" (`README.md:53`), and re-reads
   after leaving a top-up page (`README.md:39`). A badge that appears always-visible but only refreshes on
   those triggers will go stale silently; no polling infrastructure for balance is shipped.
9. **Unextracted host-side pieces.** I did not extract the ~230 non-client `@deepseek-ai/dsh-*` host
   packages (the task scoped extraction to `dsh-client-ui-*` plus three named packages), except a
   completeness probe of `dsh-web-frontend`, `dsh-web-app`, `dsh-client-modules` and
   `dsh-client-ui-renderer` (`<scratch>/asar-out2`), which contain **no** `slots.register(` or
   `children:` declarations — i.e. the shell/boot layer declares no extra slots. If a future DSH build adds
   a shell-level status bar, it would appear there first.
10. **This is a read-only inventory.** I changed no DSH source or configuration; nothing was installed,
    registered, or enabled. The extract trees are `<scratch>/asar-out` (57 packages) and
    `<scratch>/asar-out2` (4 packages); logs are `<scratch>/asar-extract-log.txt` and
    `<scratch>/asar-extract-log2.txt`; the CSS module string extracted from the layout bundle is at
    `<scratch>/layout-client-css.css`.

---

## Appendix — reproduction commands

```powershell
# 1. extract every client-ui package + the three named packages (writes its own log)
$env:ELECTRON_RUN_AS_NODE="1"
& "D:\deepseek\DeepSeek Harness.exe" "<scratch>/asar-extract-all.mjs"     # -> <scratch>/asar-out, <scratch>/asar-extract-log.txt
& "D:\deepseek\DeepSeek Harness.exe" "<scratch>/asar-extract-shell.mjs"   # -> <scratch>/asar-out2, <scratch>/asar-extract-log2.txt
```

Electron writes a harmless `DeprecationWarning` to stderr and may exit 1; **its stdout is not capturable
through a PowerShell pipeline in this sandbox**, which is why both scripts append their own log file
instead of printing results.
