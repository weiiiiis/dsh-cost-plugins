/**
 * 用桩 React 在 Node 里跑一遍 lib/client.js，验证：
 * 1) 模块包裹格式与导出（apply / inject）
 * 2) apply() 注册词典与插槽
 * 3) 组件在 ready / signedOut / failed / 抛错 四种结果下的渲染文本
 *
 * 桩 React 不做自动重渲染：每次 paint() 复位 Hook 游标后重新调用组件，
 * 挂载时收集到的 effect 立即执行一次。
 */

import { readFileSync } from "node:fs";

let hookSlots = [];
let cursor = 0;
let pendingEffects = [];

const ReactStub = {
	useState(initial) {
		const i = cursor++;
		if (!(i in hookSlots)) hookSlots[i] = typeof initial === "function" ? initial() : initial;
		const set = (next) => {
			hookSlots[i] = typeof next === "function" ? next(hookSlots[i]) : next;
		};
		return [hookSlots[i], set];
	},
	useRef(initial) {
		const i = cursor++;
		if (!(i in hookSlots)) hookSlots[i] = { current: initial };
		return hookSlots[i];
	},
	useCallback(fn) {
		cursor++;
		return fn;
	},
	useEffect(fn) {
		cursor++;
		pendingEffects.push(fn);
	},
	createElement(type, props, ...children) {
		return { type, props: props ?? {}, children: children.flat().filter((c) => c !== false && c !== null && c !== void 0) };
	}
};

// ---- 桩 window ----
let registration = null;
const listeners = new Map();
globalThis.window = {
	__ModuleLoader__: { load(reg) { registration = reg; } },
	addEventListener(name, fn) { listeners.set(name, fn); },
	removeEventListener(name) { listeners.delete(name); }
};

// ---- 加载 bundle ----
const source = readFileSync(new URL("../lib/client.js", import.meta.url), "utf8");
const requireStub = (spec) => {
	if (spec === "react") return ReactStub;
	throw new Error("unexpected require: " + spec);
};
new Function("window", "require", source)(globalThis.window, requireStub);

let failures = 0;
function check(label, ok, detail) {
	console.log((ok ? "PASS  " : "FAIL  ") + label + (detail === void 0 ? "" : "  :: " + detail));
	if (!ok) failures++;
}

check("bundle registered an id", registration !== null && registration.id === "dsh-balance-badge", registration && registration.id);
const exported = registration.factory(requireStub);
check("exports.apply is a function", typeof exported.apply === "function");
check("exports.inject is the service list", Array.isArray(exported.inject) && exported.inject.join(",") === "slots,locale,remote,remote.account", JSON.stringify(exported.inject));

// ---- 桩 ctx ----
const injected = [];
const registeredComponents = [];
let dictionaries = null;
let balanceCalls = 0;
let balanceImpl = async () => ({ ok: true, value: { status: "ready", value: [{ currency: "CNY", balance: "1234.5678" }], bonusWallets: [{ currency: "CNY", balance: "3.5" }] } });
const ctx = {
	effect(fn) { return fn(); },
	locale: {
		register(ns, dicts) { dictionaries = { ns, dicts }; return () => {}; },
		bind: () => (key) => key,
		getSnapshot: () => ({ active: "zh" })
	},
	slots: {
		inject(key, callback) { injected.push({ key, callback }); },
		register(options, component) { registeredComponents.push({ options, component }); return () => {}; }
	},
	remote: { account: { getBalance: (...args) => { balanceCalls++; return balanceImpl(...args); } } }
};

exported.apply(ctx);
check("locale dictionary registered", dictionaries !== null && dictionaries.ns === "balance-badge", dictionaries && dictionaries.ns);
check("zh/en key sets match", JSON.stringify(Object.keys(dictionaries.dicts.zh).sort()) === JSON.stringify(Object.keys(dictionaries.dicts.en).sort()));
check("slot inject used (not a bare register)", injected.length === 1 && injected[0].key === "sidebar.footer.action", JSON.stringify(injected.map((i) => i.key)));

injected[0].callback();
check("registered exactly one component into the slot", registeredComponents.length === 1, String(registeredComponents.length));
const options = registeredComponents[0] && registeredComponents[0].options;
check("register options carry name/id/order/locale", options && options.name === "sidebar.footer.action" && options.id === "balance-badge" && options.order === 10 && options.locale === "balance-badge", JSON.stringify(options));
const Component = registeredComponents[0].component;

// ---- 渲染辅助 ----
function textOf(node) {
	if (node === null || node === void 0 || node === false) return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join(" ");
	return textOf(node.children) + " " + textOf(node.props && node.props.title);
}

/** 挂载一次：执行本次渲染收集到的 effect（会触发异步读取）。 */
function paint(wide) {
	cursor = 0;
	pendingEffects = [];
	const tree = Component({ t: (k) => k, wide: wide !== false });
	for (const effect of pendingEffects) effect();
	pendingEffects = [];
	return tree;
}

/** 已经挂载过之后的重绘：不再执行 effect。 */
function repaint(wide) {
	cursor = 0;
	pendingEffects = [];
	return Component({ t: (k) => k, wide: wide !== false });
}

const settle = () => new Promise((r) => setTimeout(r, 20));

// ---- ready ----
const first = paint(true);
check("first paint shows the loading copy", textOf(first).includes("balance.loading"), textOf(first).trim());
await settle();
const ready = repaint(true);
check("ready paint shows the truncated CNY amount", textOf(ready).includes("¥1,234.56"), textOf(ready).trim());
check("ready paint keeps the bonus in the tooltip", textOf(ready).includes("3.50"), textOf(ready).trim());
check("the read was issued exactly once on mount", balanceCalls === 1, String(balanceCalls));

// ---- narrow (collapsed sidebar) ----
const narrow = repaint(false);
check("narrow paint still renders the amount", textOf(narrow).includes("¥1,234.56"), textOf(narrow).trim());

// ---- signed out ----
hookSlots = [];
balanceImpl = async () => ({ ok: true, value: null });
paint(true);
await settle();
check("signed-out paint shows the signed-out copy", textOf(repaint(true)).includes("balance.signedOut"), textOf(repaint(true)).trim());

// ---- failed result ----
hookSlots = [];
balanceImpl = async () => ({ ok: true, value: { status: "failed" } });
paint(true);
await settle();
check("failed result degrades to unavailable", textOf(repaint(true)).includes("balance.unavailable"), textOf(repaint(true)).trim());

// ---- carrier failure (ok:false) ----
hookSlots = [];
balanceImpl = async () => ({ ok: false, error: { message: "offline" } });
paint(true);
await settle();
check("carrier failure degrades to unavailable", textOf(repaint(true)).includes("balance.unavailable"), textOf(repaint(true)).trim());

// ---- throwing RPC ----
hookSlots = [];
balanceImpl = async () => { throw new Error("boom"); };
paint(true);
await settle();
check("throwing RPC degrades to unavailable", textOf(repaint(true)).includes("balance.unavailable"), textOf(repaint(true)).trim());

// ---- 点击刷新 ----
hookSlots = [];
balanceImpl = async () => ({ ok: true, value: { status: "ready", value: [{ currency: "USD", balance: "7.5" }], bonusWallets: [] } });
const clicked = paint(true);
await settle();
clicked.props.onClick();
await settle();
check("clicking refetches and shows the USD wallet", textOf(repaint(true)).includes("$7.50"), textOf(repaint(true)).trim());

console.log(failures === 0 ? "\nALL CHECKS PASSED" : "\n" + failures + " CHECK(S) FAILED");
// 组件的 setInterval 在桩里没有清理，直接结束进程。
process.exit(failures === 0 ? 0 : 1);
