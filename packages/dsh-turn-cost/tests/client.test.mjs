/**
 * 用桩 React 在 Node 里跑一遍 dsh-turn-cost 的 lib/client.js：
 * 1) 模块包裹与导出
 * 2) apply() 注册词典与三个插槽（页脚标签 / 输入框汇总 / 全屏弹幕层）
 * 3) 逐轮用量折叠 + 价格换算 + 渲染文本
 * 4) 分级配色、缓存命中提示、分步拆解、跨高峰计价
 * 5) 会话/今日/近 7 天汇总、还够跑几轮、日预算与本地账本去重
 * 6) 点击放大与好贵弹幕
 */

import { readFileSync } from "node:fs";

// 每个组件一份 Hook 存储，这样才能同时挂载页脚标签、汇总和弹幕层三个组件。
let hooks = [];
let cursor = 0;
let pendingEffects = [];
let hookStore = new WeakMap();

/** 进入某个组件的渲染：切到它自己的 Hook 存储并复位游标。 */
function enter(component) {
	let store = hookStore.get(component);
	if (store === void 0) {
		store = [];
		hookStore.set(component, store);
	}
	hooks = store;
	cursor = 0;
	pendingEffects = [];
}
/** 丢掉所有组件的 Hook 状态（下次渲染重新初始化）。 */
function resetHooks() {
	hookStore = new WeakMap();
}

const ReactStub = {
	useState(initial) {
		const i = cursor++;
		// 捕获「本次渲染所属组件」的存储：多组件共存时不能共用模块级变量，
		// 否则一次 setState 会写到当时恰好活跃的另一个组件里去。
		const store = hooks;
		if (!(i in store)) store[i] = typeof initial === "function" ? initial() : initial;
		return [store[i], (next) => { store[i] = typeof next === "function" ? next(store[i]) : next; }];
	},
	useRef(initial) {
		const i = cursor++;
		const store = hooks;
		if (!(i in store)) store[i] = { current: initial };
		return store[i];
	},
	useMemo(fn) {
		cursor++;
		return fn();
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

let registration = null;
globalThis.window = {
	__ModuleLoader__: { load(reg) { registration = reg; } },
	addEventListener() {},
	removeEventListener() {}
};

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

check("bundle registered an id", registration !== null && registration.id === "dsh-turn-cost", registration && registration.id);
const exported = registration.factory(requireStub);
check("exports.apply is a function", typeof exported.apply === "function");
check("exports.inject is the service list", Array.isArray(exported.inject) && exported.inject.join(",") === "slots,locale,sessions,remote,remote.account", JSON.stringify(exported.inject));

// ---------------- 合成会话事件 ----------------
const OFF_PEAK = Date.UTC(2026, 9, 5, 20, 0, 0); // 北京 10-06 04:00，周二凌晨 -> 空闲
const PEAK = Date.UTC(2026, 9, 6, 2, 0, 0); // 北京 10-06 10:00，周二上午 -> 高峰
const USAGE = { inputTokens: 1200, outputTokens: 900, cacheReadTokens: 48000, cacheWriteTokens: 800, totalTokens: 50900 };

/** 四档一致的 usage。 */
const U = (input, output, read = 0, write = 0) => ({
	inputTokens: input,
	outputTokens: output,
	cacheReadTokens: read,
	cacheWriteTokens: write,
	totalTokens: input + output + read + write
});

function turnEvents(time, messageId, model, usage) {
	return [
		{ type: "turn/start", seq: 1, time, data: { turn: 1 } },
		{ type: "step/start", seq: 2, time, data: { turn: 1, step: 1 } },
		{
			type: "assistant/message",
			seq: 3,
			time,
			data: {
				turn: 1,
				step: 1,
				message: { id: messageId, source: { provider: "deepseek-official", model } },
				usage
			}
		},
		{ type: "step/end", seq: 4, time, data: { turn: 1, step: 1 } },
		{ type: "turn/end", seq: 5, time, data: { turn: 1, reason: { kind: "stop" } } }
	];
}

/** 造一个 turn 的事件序列（entries 形式）。 */
function turn(time, messageId, usage, turnNo) {
	return [
		{ type: "turn/start", seq: 1, time, data: { turn: turnNo } },
		{ type: "step/start", seq: 2, time, data: { turn: turnNo, step: 1 } },
		{ type: "assistant/message", seq: 3, time, data: { turn: turnNo, step: 1, message: { id: messageId, source: { provider: "deepseek-official", model: "deepseek-flash" } }, usage } },
		{ type: "step/end", seq: 4, time, data: { turn: turnNo, step: 1 } },
		{ type: "turn/end", seq: 5, time, data: { turn: turnNo, reason: { kind: "stop" } } }
	].map((event) => ({ type: "event", event }));
}

const entries = [
	// 流式临时行必须被忽略
	{ type: "transient", event: { type: "assistant/attempt", seq: 99, time: 0, data: { turn: 9, step: 1, stream: [] } } },
	// 客户端专有的流式分片也要忽略（seq 是分数）
	{ type: "event", event: { type: "assistant/live-chunk", seq: 2.5, time: 0, data: { attemptId: "a", turn: 1, step: 1, chunk: {} } } },
	...turnEvents(OFF_PEAK, "msg-off", "deepseek-flash", USAGE).map((event) => ({ type: "event", event }))
];
const peakEntries = turnEvents(PEAK, "msg-peak", "deepseek-flash", USAGE).map((event) => ({ type: "event", event }));
const noRouteEntries = turnEvents(OFF_PEAK, "msg-noroute", { provider: "", model: "" }, USAGE).map((event) => ({ type: "event", event }));

// ---------------- 桩 ctx ----------------
const injectedSlots = [];
const registeredComponents = [];
let dictionaries = null;
const sessions = { binding: (sessionId) => sessionId === "s1" ? { sessionId, eventSource: { getSnapshot: () => ({ entries, hasMore: false, revision: 1 }), subscribe: () => () => {} } } : undefined };
const ctx = {
	effect(fn) { return fn(); },
	locale: {
		register(ns, dicts) { dictionaries = { ns, dicts }; return () => {}; },
		bind: () => (key) => key,
		getSnapshot: () => ({ active: "zh" })
	},
	slots: {
		inject(key, callback) { injectedSlots.push({ key, callback }); },
		register(options, component) { registeredComponents.push({ options, component }); return () => {}; }
	},
	remote: {
		account: {
			getBalance: async () => ({ ok: true, value: { status: "ready", value: [{ currency: "CNY", balance: "120.00" }], bonusWallets: [] } })
		}
	},
	sessions
};

// ---------------- 浏览器环境桩（必须早于 apply：apply 会注入样式表） ----------------
const storage = new Map();
globalThis.localStorage = {
	getItem: (key) => storage.has(key) ? storage.get(key) : null,
	setItem: (key, value) => { storage.set(key, String(value)); },
	removeItem: (key) => { storage.delete(key); }
};

let capturedCsv = null;
const downloads = [];
const styleTags = [];
globalThis.Blob = class { constructor(parts) { capturedCsv = parts.join(""); } };
globalThis.URL.createObjectURL = () => "blob:stub";
globalThis.URL.revokeObjectURL = () => {};
globalThis.document = {
	createElement: () => {
		const element = {
			dataset: {},
			textContent: "",
			href: "",
			download: "",
			click() { if (element.download !== "") downloads.push({ name: element.download, body: capturedCsv }); }
		};
		return element;
	},
	querySelector: (selector) => styleTags.find((tag) => selector.includes(tag.dataset.pluginCss)) ?? null,
	body: { appendChild() {}, removeChild() {} },
	head: { appendChild: (tag) => styleTags.push(tag) }
};

exported.apply(ctx);
check("locale dictionary registered", dictionaries !== null && dictionaries.ns === "turn-cost", dictionaries && dictionaries.ns);
check("zh/en key sets match", JSON.stringify(Object.keys(dictionaries.dicts.zh).sort()) === JSON.stringify(Object.keys(dictionaries.dicts.en).sort()));
check("injects into all five slots", injectedSlots.length === 5
	&& injectedSlots[0].key === "conversation.chat.assistant-actions"
	&& injectedSlots[1].key === "conversation.composer.dock"
	&& injectedSlots[2].key === "shell.overlay"
	&& injectedSlots[3].key === "main"
	&& injectedSlots[4].key === "sidebar.panellist", JSON.stringify(injectedSlots.map((s) => s.key)));

injectedSlots[0].callback();
injectedSlots[1].callback();
injectedSlots[2].callback();
injectedSlots[3].callback();
injectedSlots[4].callback();
const options = registeredComponents[0] && registeredComponents[0].options;
const summaryOptions = registeredComponents[1] && registeredComponents[1].options;
const danmakuOptions = registeredComponents[2] && registeredComponents[2].options;
const pageOptions = registeredComponents[3] && registeredComponents[3].options;
const iconOptions = registeredComponents[4] && registeredComponents[4].options;
check("pill register options", options && options.name === "conversation.chat.assistant-actions" && options.id === "turn-cost" && options.order === 20 && options.locale === "turn-cost", JSON.stringify(options));
check("summary registers into the composer dock", summaryOptions && summaryOptions.name === "conversation.composer.dock" && summaryOptions.id === "turn-cost-summary", JSON.stringify(summaryOptions));
check("danmaku layer registers into shell.overlay without session scope", danmakuOptions && danmakuOptions.name === "shell.overlay" && danmakuOptions.id === "turn-cost-danmaku" && danmakuOptions.inject === void 0, JSON.stringify(danmakuOptions));
check("history page registers into the keyed main slot", pageOptions && pageOptions.name === "main" && pageOptions.key === "turn-cost-history", JSON.stringify(pageOptions));
check("history icon registers into the sidebar list with the same id", iconOptions && iconOptions.name === "sidebar.panellist" && iconOptions.id === pageOptions.key && iconOptions.order === 100 && typeof iconOptions.label === "function", JSON.stringify({ id: iconOptions.id, order: iconOptions.order }));
check("the history panel id avoids the shipped ones", pageOptions.key !== "plugins" && pageOptions.key !== "schedules" && pageOptions.key !== "conversation", pageOptions.key);
check("session-scoped inject takes sessionId", typeof options.inject === "function", typeof options.inject);

const injected = options.inject("s1");
check("inject returns the eventSource as a bare hook source", injected && injected.hooks && typeof injected.hooks.events.getSnapshot === "function" && typeof injected.hooks.events.subscribe === "function");
check("the source reads through to the session window", injected.hooks.events.getSnapshot().entries === entries);

const missingSource = options.inject("missing");
check("unknown session yields an empty window instead of throwing", missingSource.hooks.events.getSnapshot().entries.length === 0);
check("unknown session subscribe is a no-op unsubscribe", typeof missingSource.hooks.events.subscribe(() => {}) === "function");

// ---------------- 渲染辅助 ----------------
const Component = registeredComponents[0].component;
const t = (key, params) => params === void 0 ? key : key + "(" + JSON.stringify(params) + ")";
function textOf(node) {
	if (node === null || node === void 0 || node === false) return "";
	if (typeof node === "string" || typeof node === "number") return String(node);
	if (Array.isArray(node)) return node.map(textOf).join(" ");
	return textOf(node.children) + " " + textOf(node.props && node.props.title);
}
function render(props) {
	enter(Component);
	return Component(props);
}
/** 挂载任意组件并执行本次渲染收集到的 effect（汇总与弹幕层靠 effect 订阅）。 */
function paintWith(component, props) {
	enter(component);
	const tree = component(props);
	for (const effect of pendingEffects) effect();
	pendingEffects = [];
	return tree;
}
/** 只重绘，不再跑 effect。 */
function repaintWith(component, props) {
	enter(component);
	return component(props);
}

// ---------------- 基本渲染 ----------------
const offTree = render({ messageId: "msg-off", useEvents: (select) => select({ entries }), t });
check("off-peak pill shows ¥0.0066", textOf(offTree).includes("¥0.0066"), textOf(offTree).trim().slice(0, 100));
check("tooltip lists the four buckets", textOf(offTree).includes("cost.uncachedInput") && textOf(offTree).includes("cost.cacheRead") && textOf(offTree).includes("cost.cacheWrite") && textOf(offTree).includes("cost.output"));
check("tooltip names the model and the window", textOf(offTree).includes("deepseek-flash") && textOf(offTree).includes("cost.offPeak"));
check("tooltip shows the unit prices", textOf(offTree).includes("0.02 / 1 / 4"), textOf(offTree).match(/cost\.unit[^"]*/)?.[0]);
check("tooltip splits input and output money", textOf(offTree).includes("cost.split"), textOf(offTree).match(/cost\.split[^\n]*/)?.[0]);

const peakTree = render({ messageId: "msg-peak", useEvents: (select) => select({ entries: peakEntries }), t });
check("peak-hour pill doubles to ¥0.0131", textOf(peakTree).includes("¥0.0131"), textOf(peakTree).trim().slice(0, 70));
check("peak window is named", textOf(peakTree).includes("cost.peak") && !textOf(peakTree).includes("cost.offPeak"));

const noRouteTree = render({ messageId: "msg-noroute", useEvents: (select) => select({ entries: noRouteEntries }), t });
check("missing route falls back to the conservative price", textOf(noRouteTree).includes("¥0.0131"), textOf(noRouteTree).trim().slice(0, 70));

check("unknown message renders nothing", render({ messageId: "nope", useEvents: (select) => select({ entries }), t }) === null);

const truncated = turnEvents(OFF_PEAK, "msg-cut", "deepseek-flash", USAGE).slice(0, 3).map((event) => ({ type: "event", event }));
check("incomplete turn evidence renders nothing", render({ messageId: "msg-cut", useEvents: (select) => select({ entries: truncated }), t }) === null);

// ---------------- 跨高峰边界 ----------------
// 第 1 步在空闲价、第 2 步在高峰价：整轮金额应等于两步各自计价之和，而不是按收尾时间一刀切。
const crossing = [
	{ type: "turn/start", seq: 1, time: OFF_PEAK, data: { turn: 1 } },
	{ type: "step/start", seq: 2, time: OFF_PEAK, data: { turn: 1, step: 1 } },
	{ type: "assistant/message", seq: 3, time: OFF_PEAK, data: { turn: 1, step: 1, message: { id: "x1", source: { provider: "p", model: "deepseek-flash" } }, usage: U(1000000, 0) } },
	{ type: "step/end", seq: 4, time: OFF_PEAK, data: { turn: 1, step: 1 } },
	{ type: "step/start", seq: 5, time: PEAK, data: { turn: 1, step: 2 } },
	{ type: "assistant/message", seq: 6, time: PEAK, data: { turn: 1, step: 2, message: { id: "x2", source: { provider: "p", model: "deepseek-flash" } }, usage: U(1000000, 0) } },
	{ type: "step/end", seq: 7, time: PEAK, data: { turn: 1, step: 2 } },
	{ type: "turn/end", seq: 8, time: PEAK, data: { turn: 1, reason: { kind: "stop" } } }
].map((event) => ({ type: "event", event }));
const crossTree = render({ messageId: "x2", useEvents: (select) => select({ entries: crossing }), t });
// 空闲 ¥1.00 + 高峰 ¥2.00 = ¥3.00；若按收尾时间一刀切会得到 ¥4.00
check("a turn crossing the peak boundary is priced per step", textOf(crossTree).includes("¥3.00"), textOf(crossTree).slice(0, 20));
check("mixed peak is labelled", textOf(crossTree).includes("cost.mixedPeak"), textOf(crossTree).match(/cost\.mixedPeak/)?.[0]);

// ---------------- 多步与去重 ----------------
const multiEntries = [
	{ type: "turn/start", seq: 1, time: OFF_PEAK, data: { turn: 1 } },
	{ type: "step/start", seq: 2, time: OFF_PEAK, data: { turn: 1, step: 1 } },
	{ type: "assistant/message", seq: 3, time: OFF_PEAK, data: { turn: 1, step: 1, message: { id: "step-1", source: { provider: "p", model: "deepseek-flash" } }, usage: U(10, 10) } },
	{ type: "step/end", seq: 4, time: OFF_PEAK, data: { turn: 1, step: 1 } },
	{ type: "step/start", seq: 5, time: OFF_PEAK, data: { turn: 1, step: 2 } },
	{ type: "assistant/message", seq: 6, time: OFF_PEAK, data: { turn: 1, step: 2, message: { id: "step-2", source: { provider: "p", model: "deepseek-flash" } }, usage: USAGE } },
	{ type: "step/end", seq: 7, time: OFF_PEAK, data: { turn: 1, step: 2 } },
	{ type: "turn/end", seq: 8, time: OFF_PEAK, data: { turn: 1, reason: { kind: "stop" } } }
].map((event) => ({ type: "event", event }));
check("closing message of a multi-step turn shows the whole turn", textOf(render({ messageId: "step-2", useEvents: (select) => select({ entries: multiEntries }), t })).includes("¥0.0066"));
check("intermediate step shows nothing (no double counting)", render({ messageId: "step-1", useEvents: (select) => select({ entries: multiEntries }), t }) === null);

// ---------------- 分级配色 ----------------
const TIER_ENTRIES = [
	...turn(OFF_PEAK, "cheap", U(1000, 100), 1),
	...turn(OFF_PEAK, "warn", U(600000, 0), 2),
	...turn(OFF_PEAK, "alert", U(3200000, 0), 3)
];
const tierProps = (messageId) => ({ messageId, useEvents: (select) => select({ entries: TIER_ENTRIES }), t });

const cheap = render(tierProps("cheap"));
check("¥0.0014 falls in the normal tier", cheap.props["data-turn-cost"] === "normal", cheap.props["data-turn-cost"]);
check("normal tier inherits the parent colour", cheap.props.style.color === void 0, String(cheap.props.style.color));

const warn = render(tierProps("warn"));
check("¥0.60 falls in the warn tier", warn.props["data-turn-cost"] === "warn", warn.props["data-turn-cost"]);
check("warn tier uses the theme warn colour", String(warn.props.style.color).includes("state-warn-primary"), String(warn.props.style.color));

const alert = render(tierProps("alert"));
check("¥3.20 falls in the alert tier", alert.props["data-turn-cost"] === "alert", alert.props["data-turn-cost"]);
check("alert tier uses the theme error colour", String(alert.props.style.color).includes("state-error-primary"), String(alert.props.style.color));
check("alert tier also bolds (not colour alone)", alert.props.style.fontWeight === 600, String(alert.props.style.fontWeight));
check("alert tier explains itself to screen readers", String(alert.props["aria-label"]).includes("cost.veryExpensive"), alert.props["aria-label"]);

const alertText = textOf(alert);
check("tooltip carries the session median", alertText.includes("cost.compare") && alertText.includes("¥0.60"), alertText.match(/cost\.compare[^\n]*/)?.[0]);
check("tooltip carries the cache hit rate", alertText.includes("cost.hitRate"), alertText.match(/cost\.hitRate[^\n]*/)?.[0]);
check("tooltip marks the dearest turn", alertText.includes("cost.dearest"));

// 相对抬档：金额本身不到绝对阈值，但明显比自己平时贵
const RELATIVE_ENTRIES = [
	...turn(OFF_PEAK, "r1", U(1000, 100), 1),
	...turn(OFF_PEAK, "r2", U(1000, 100), 2),
	...turn(OFF_PEAK, "r3", U(1000, 100), 3),
	...turn(OFF_PEAK, "r4", U(1000, 100), 4),
	...turn(OFF_PEAK, "outlier", U(5000, 1000), 5)
];
const outlier = render({ messageId: "outlier", useEvents: (select) => select({ entries: RELATIVE_ENTRIES }), t });
check("¥0.009 below the absolute gate, bumped by the relative rule", outlier.props["data-turn-cost"] === "warn", outlier.props["data-turn-cost"]);
check("the bump explains the multiple", textOf(outlier).includes("cost.ratio") && textOf(outlier).includes("6.4"), textOf(outlier).match(/cost\.ratio[^\n]*/)?.[0]);

const fewTurns = [...RELATIVE_ENTRIES.slice(0, 5), ...RELATIVE_ENTRIES.slice(-5)];
check("under 4 samples the relative rule stays off", render({ messageId: "outlier", useEvents: (select) => select({ entries: fewTurns }), t }).props["data-turn-cost"] === "normal");

// ---------------- 缓存提示 ----------------
const missTree = render({ messageId: "miss", useEvents: (select) => select({ entries: turn(OFF_PEAK, "miss", U(200000, 100), 1) }), t });
check("0% hit rate with a big premium raises the marker", missTree.props["data-turn-cost-cache"] === "low", String(missTree.props["data-turn-cost-cache"]));
check("the marker carries the hit rate", textOf(missTree).includes("↓0%"), textOf(missTree).slice(0, 40));
check("the tooltip quantifies the premium", textOf(missTree).includes("cost.lowCache"), textOf(missTree).match(/cost\.lowCache[^\n]*/)?.[0]);

const hitTree = render({ messageId: "hit", useEvents: (select) => select({ entries: turn(OFF_PEAK, "hit", U(0, 100, 200000, 0), 1) }), t });
check("a full cache hit raises no marker", hitTree.props["data-turn-cost-cache"] === void 0, String(hitTree.props["data-turn-cost-cache"]));
check("a full cache hit reads 100%", textOf(hitTree).includes("100%"), textOf(hitTree).match(/cost\.hitRate[^\n]*/)?.[0]);

check("a small miss raises no marker", render({ messageId: "small", useEvents: (select) => select({ entries: turn(OFF_PEAK, "small", U(3000, 50), 1) }), t }).props["data-turn-cost-cache"] === void 0);

// ---------------- 分步拆解 ----------------
const STEP_ENTRIES = [
	{ type: "turn/start", seq: 1, time: OFF_PEAK, data: { turn: 1 } },
	{ type: "step/start", seq: 2, time: OFF_PEAK, data: { turn: 1, step: 1 } },
	{ type: "assistant/message", seq: 3, time: OFF_PEAK, data: { turn: 1, step: 1, message: { id: "s1", source: { provider: "deepseek-official", model: "deepseek-flash" } }, usage: U(1000, 100) } },
	{ type: "tool/call", seq: 4, time: OFF_PEAK, data: { turn: 1, step: 1, callId: "c1", name: "pwsh", arguments: "{}" } },
	{ type: "tool/result", seq: 5, time: OFF_PEAK, data: { turn: 1, step: 1, callId: "c1" } },
	{ type: "tool/call", seq: 6, time: OFF_PEAK, data: { turn: 1, step: 1, callId: "c2", name: "pwsh", arguments: "{}" } },
	{ type: "step/end", seq: 7, time: OFF_PEAK, data: { turn: 1, step: 1 } },
	{ type: "step/start", seq: 8, time: OFF_PEAK, data: { turn: 1, step: 2 } },
	{ type: "assistant/message", seq: 9, time: OFF_PEAK, data: { turn: 1, step: 2, message: { id: "s2", source: { provider: "deepseek-official", model: "deepseek-flash" } }, usage: U(40000, 3000) } },
	{ type: "tool/call", seq: 10, time: OFF_PEAK, data: { turn: 1, step: 2, callId: "c3", name: "read", arguments: "{}" } },
	{ type: "step/end", seq: 11, time: OFF_PEAK, data: { turn: 1, step: 2 } },
	{ type: "turn/end", seq: 12, time: OFF_PEAK, data: { turn: 1, reason: { kind: "stop" } } }
].map((event) => ({ type: "event", event }));
const stepText = textOf(render({ messageId: "s2", useEvents: (select) => select({ entries: STEP_ENTRIES }), t }));
check("tooltip has the breakdown heading", stepText.includes("cost.breakdown"), stepText.match(/cost\.breakdown/)?.[0]);
check("steps are listed dearest first", stepText.indexOf('"step":"2"') < stepText.indexOf('"step":"1"'), stepText.match(/cost\.step[^\n]*/g)?.join(" | "));
check("each step names its tools and counts", stepText.includes("pwsh ×2") && stepText.includes("read"), stepText.match(/cost\.step[^\n]*/g)?.join(" | "));

// ---------------- 会话 / 今日 / 预算汇总 ----------------
const summaryComponent = registeredComponents[1].component;
const summaryProps = (entriesArg) => ({
	sessionId: "s1",
	useEvents: (select) => select({ entries: entriesArg }),
	useProjection: (key) => key === "contextPressure" ? { projectedTokens: 243000, contextWindow: 1000000 } : void 0,
	t
});
resetHooks();
paintWith(summaryComponent, summaryProps(TIER_ENTRIES));
await new Promise((resolve) => setTimeout(resolve, 20)); // 余额是异步读的
const summaryText = textOf(repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)));
check("summary shows the session total and turn count", summaryText.includes("cost.session") && summaryText.includes('"turns":"3"'), summaryText.slice(0, 100));
check("summary shows today", summaryText.includes("cost.today"), summaryText.slice(0, 100));
check("summary shows the last 7 days", summaryText.includes("cost.week"), summaryText.slice(0, 100));
check("summary shows the cache hit rate", summaryText.includes("cost.hitRateShort") && summaryText.includes("0%"), summaryText.match(/cost\.hitRateShort[^·]*/)?.[0]);
check("summary shows the context size", summaryText.includes("cost.context") && summaryText.includes("243.0k"), summaryText.match(/cost\.context[^·]*/)?.[0]);
check("summary shows the next-turn estimate range", summaryText.includes("cost.nextEstimate"), summaryText.match(/cost\.nextEstimate[^·]*/)?.[0]);
check("summary shows how many turns the balance still covers", summaryText.includes("cost.remaining") && summaryText.includes('"turns":"94"'), summaryText.match(/cost\.remaining[^·]*/)?.[0]);
check("summary is clickable for the budget", repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.role === "button");
check("summary takes its own row below the stats line", repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.flex === "0 0 100%" && repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.order === 1, String(repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.flex));
check("summary matches the stats line typography, one step smaller", repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.fontSize.includes("--dsh-content-font-size-secondary") && repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.fontSize.includes("- 2px") && repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.lineHeight.includes("18px"), String(repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.fontSize) + " / " + String(repaintWith(summaryComponent, summaryProps(TIER_ENTRIES)).props.style.lineHeight));
check("the plugin injected exactly one style tag", styleTags.length === 1 && styleTags[0].dataset.plugin === "dsh-turn-cost", String(styleTags.length));
check("the stylesheet makes the composer dock wrap", styleTags[0].textContent.includes("_dock") && styleTags[0].textContent.includes("flex-wrap:wrap") && styleTags[0].textContent.includes("[data-turn-cost-summary]"), styleTags[0].textContent.slice(-90));
check("the stylesheet also carries the danmaku keyframes", styleTags[0].textContent.includes("@keyframes dsh-turn-cost-fly"));
check("re-applying would not inject a second tag", document.querySelector('style[data-plugin-css="dsh-turn-cost/styles.css"]') !== null);
check("ledger was written to local storage", storage.has("dsh-turn-cost.ledger.v1"), String(storage.size));

const ledgerAfterFirst = JSON.parse(storage.get("dsh-turn-cost.ledger.v1"));
const todayKey = Object.keys(ledgerAfterFirst.days)[0];
check("today's total equals the three turns", Math.abs(ledgerAfterFirst.days[todayKey] - (0.0014 + 0.6 + 3.2)) < 1e-9, String(ledgerAfterFirst.days[todayKey]));

paintWith(summaryComponent, summaryProps(TIER_ENTRIES));
const ledgerAfterSecond = JSON.parse(storage.get("dsh-turn-cost.ledger.v1"));
check("re-rendering does not double count", ledgerAfterSecond.days[todayKey] === ledgerAfterFirst.days[todayKey], String(ledgerAfterSecond.days[todayKey]));

check("no priced turn renders no summary", paintWith(summaryComponent, summaryProps([])) === null);

// ---------------- 日预算 ----------------
storage.set("dsh-turn-cost.budget.v1", "4");
resetHooks();
paintWith(summaryComponent, summaryProps(TIER_ENTRIES));
const nearTree = repaintWith(summaryComponent, summaryProps(TIER_ENTRIES));
check("budget at 95% marks the line as near", nearTree.props["data-turn-cost-summary"] === "near", nearTree.props["data-turn-cost-summary"]);
check("the budget replaces the plain today segment", textOf(nearTree).includes("cost.budget"), textOf(nearTree).match(/cost\.budget[^·]*/)?.[0]);
check("near budget uses the warn colour", String(nearTree.props.style.color).includes("state-warn-primary"), String(nearTree.props.style.color));

storage.set("dsh-turn-cost.budget.v1", "3");
resetHooks();
paintWith(summaryComponent, summaryProps(TIER_ENTRIES));
const overTree = repaintWith(summaryComponent, summaryProps(TIER_ENTRIES));
check("over budget marks the line as over", overTree.props["data-turn-cost-summary"] === "over", overTree.props["data-turn-cost-summary"]);
check("over budget is stated in words too", textOf(overTree).includes("cost.budgetOver"));
check("over budget uses the error colour", String(overTree.props.style.color).includes("state-error-primary"), String(overTree.props.style.color));
check("the budget alert was recorded for today", JSON.parse(storage.get("dsh-turn-cost.ledger.v1")).alerted !== void 0);

storage.delete("dsh-turn-cost.budget.v1");
resetHooks();
const idleTree = paintWith(summaryComponent, summaryProps(TIER_ENTRIES));
check("without a budget the line is normal", idleTree.props["data-turn-cost-summary"] === "ok", idleTree.props["data-turn-cost-summary"]);
check("the tooltip offers to set a budget", String(idleTree.props.title).includes("cost.budgetUnset"));
idleTree.props.onClick();
check("clicking cycles the budget to the first tier", storage.get("dsh-turn-cost.budget.v1") === "5", String(storage.get("dsh-turn-cost.budget.v1")));
let budgetPrevented = false;
idleTree.props.onKeyDown({ key: "Enter", preventDefault: () => { budgetPrevented = true; } });
check("Enter cycles the budget too", budgetPrevented && storage.get("dsh-turn-cost.budget.v1") === "10", String(storage.get("dsh-turn-cost.budget.v1")));
storage.delete("dsh-turn-cost.budget.v1");

// ---------------- 点击放大 ----------------
resetHooks();
const compact = render(tierProps("warn"));
check("starts compact", compact.props.style.fontSize === "inherit", String(compact.props.style.fontSize));
check("is clickable and keyboard reachable", compact.props.role === "button" && compact.props.tabIndex === 0, compact.props.role);
check("title offers to enlarge", String(compact.props.title).includes("cost.enlargeHint"));

compact.props.onClick();
resetHooks();
const big = render(tierProps("warn"));
check("a click enlarges the amount", String(big.props.style.fontSize).includes("em"), String(big.props.style.fontSize));
check("the enlarged amount is bold", big.props.style.fontWeight === 600, String(big.props.style.fontWeight));
check("the enlarged pill is marked", big.props["data-turn-cost-enlarged"] === "", String(big.props["data-turn-cost-enlarged"]));
check("the preference is persisted", storage.get("dsh-turn-cost.enlarged.v1") === "1", String(storage.get("dsh-turn-cost.enlarged.v1")));
check("enlarging applies to every turn, not just the clicked one", String(render(tierProps("cheap")).props.style.fontSize).includes("em"));
check("title now offers to shrink", String(big.props.title).includes("cost.shrinkHint"));

big.props.onClick();
resetHooks();
check("a second click restores the size", render(tierProps("warn")).props.style.fontSize === "inherit");
check("the restored preference is persisted", storage.get("dsh-turn-cost.enlarged.v1") === "0", String(storage.get("dsh-turn-cost.enlarged.v1")));

resetHooks();
const keyed = render(tierProps("warn"));
let prevented = false;
keyed.props.onKeyDown({ key: "Enter", preventDefault: () => { prevented = true; } });
check("Enter toggles too", prevented && storage.get("dsh-turn-cost.enlarged.v1") === "1", String(storage.get("dsh-turn-cost.enlarged.v1")));
let ignored = false;
keyed.props.onKeyDown({ key: "a", preventDefault: () => { ignored = true; } });
check("other keys are ignored", ignored === false && storage.get("dsh-turn-cost.enlarged.v1") === "1");
keyed.props.onClick();

// ---------------- 好贵弹幕 ----------------
resetHooks();
const layer = registeredComponents[2].component;
paintWith(layer, { t });

// 首次见到一个会话：只登记历史轮次，不播报——否则打开页面就被几十条弹幕糊住
paintWith(Component, { messageId: "cheap", sessionId: "s-danmaku", useEvents: (select) => select({ entries: TIER_ENTRIES }), t });
check("history produces no barrage", repaintWith(layer, { t }) === null);

// 新完成一轮且金额过线、并且刷新历史最高价（¥4.00 > 历史 ¥3.20）：
// 条数随金额增长 -> 12 + 4*12 = 60，封顶 48
const withFresh = [...TIER_ENTRIES, ...turn(OFF_PEAK, "fresh", U(4000000, 0), 9)];
paintWith(Component, { messageId: "fresh", sessionId: "s-danmaku", useEvents: (select) => select({ entries: withFresh }), t });
const barrage = repaintWith(layer, { t });
check("an expensive new turn fires a full-screen barrage", barrage !== null && barrage.props["data-turn-cost-danmaku"] === 48, barrage === null ? "null" : String(barrage.props["data-turn-cost-danmaku"]));
check("the barrage scales with the amount and caps at 48", barrage !== null && barrage.props["data-turn-cost-danmaku"] === 48, "¥4.00 -> 48 条（封顶）");
check("the layer never blocks clicks", barrage !== null && barrage.props.style.pointerEvents === "none", barrage === null ? "null" : String(barrage.props.style.pointerEvents));
check("the layer is hidden from assistive tech", barrage !== null && barrage.props["aria-hidden"] === "true");
check("the barrage spreads over distinct rows", barrage !== null && new Set(barrage.children.map((item) => item.props.style.top)).size === 48, barrage === null ? "null" : barrage.children.length + " items");
check("every danmaku carries text, colour and timing", barrage !== null && barrage.children.every((item) => textOf(item).includes("cost.danmaku") && item.props.style.color !== void 0 && item.props.style.animationDuration !== void 0 && item.props.style.animationDelay !== void 0), barrage === null ? "null" : textOf(barrage.children[0]));

// 这一轮刷新了历史最高价，所以用破纪录文案
check("a record-breaking turn uses the record copy", barrage !== null && textOf(barrage).includes("cost.danmakuRecord"), barrage === null ? "null" : textOf(barrage).slice(0, 40));

// 同一条回答重绘不应重复播报
paintWith(Component, { messageId: "fresh", sessionId: "s-danmaku", useEvents: (select) => select({ entries: withFresh }), t });
check("the same turn is announced only once", repaintWith(layer, { t }).props["data-turn-cost-danmaku"] === 48, String(repaintWith(layer, { t }).props["data-turn-cost-danmaku"]));

// 新一轮但很便宜：保持安静
const withCheap = [...withFresh, ...turn(OFF_PEAK, "cheap2", U(1000, 100), 10)];
paintWith(Component, { messageId: "cheap2", sessionId: "s-danmaku", useEvents: (select) => select({ entries: withCheap }), t });
check("a cheap new turn stays quiet", repaintWith(layer, { t }).props["data-turn-cost-danmaku"] === 48, String(repaintWith(layer, { t }).props["data-turn-cost-danmaku"]));

// 冷却：紧接着另一轮贵的，仍在冷却窗口内，不放
const withAnother = [...withCheap, ...turn(OFF_PEAK, "fresh2", U(4000000, 0), 11)];
paintWith(Component, { messageId: "fresh2", sessionId: "s-danmaku", useEvents: (select) => select({ entries: withAnother }), t });
check("a second expensive turn inside the cooldown stays quiet", repaintWith(layer, { t }).props["data-turn-cost-danmaku"] === 48, String(repaintWith(layer, { t }).props["data-turn-cost-danmaku"]));

check("firing with no layer mounted is harmless", paintWith(Component, { messageId: "fresh", sessionId: "s-none", useEvents: (select) => select({ entries: withFresh }), t }) !== void 0);

// ---------------- 花费历史面板 ----------------
storage.set("dsh-turn-cost.ledger.v1", JSON.stringify({
	version: 1,
	days: { "2026-10-06": 3.4, "2026-10-05": 1.1 },
	seen: {
		"s1:m1": { day: "2026-10-06", cost: 1, session: "s1" },
		"s1:m2": { day: "2026-10-06", cost: 2.4, session: "s1" },
		"s2:m1": { day: "2026-10-05", cost: 1.1, session: "s2" }
	}
}));

const panelComponent = registeredComponents[3].component;
resetHooks();
const panelText = textOf(paintWith(panelComponent, { t }));
check("history lists both days", panelText.includes("2026-10-06") && panelText.includes("2026-10-05"), panelText.slice(0, 140));
check("history lists both sessions", panelText.includes("s1") && panelText.includes("s2"));
check("history shows turn counts", panelText.includes("costHistory.turns"), panelText.match(/costHistory\.turns/)?.[0]);
check("history shows the summary line", panelText.includes("costHistory.summary"), panelText.match(/costHistory\.summary[^"]*/)?.[0]);
check("history offers an export button", panelText.includes("costHistory.export"));
check("history page owns its height and scroll", paintWith(panelComponent, { t }).props.style.height === "100%" && paintWith(panelComponent, { t }).props.style.overflow === "hidden", String(paintWith(panelComponent, { t }).props.style.height));

// CSV 导出：把内容截下来看
resetHooks();
const exportTree = paintWith(panelComponent, { t });
const exportButton = exportTree.children[0].children[0].children[3];
check("the export button is wired", typeof exportButton.props.onClick === "function");
exportButton.props.onClick();
check("export produces a download", downloads.length === 1 && downloads[0].name === "dsh-turn-cost.csv", JSON.stringify(downloads.map((d) => d.name)));
check("CSV carries a BOM for Excel", capturedCsv !== null && capturedCsv.charCodeAt(0) === 0xfeff);
check("CSV has both sections", capturedCsv.includes("日期,金额(元),轮数") && capturedCsv.includes("会话,金额(元),轮数"));
check("CSV holds the per-day rows", capturedCsv.includes("2026-10-06,3.400000,2") && capturedCsv.includes("2026-10-05,1.100000,1"), capturedCsv.split("\r\n").slice(1, 3).join(" | "));
check("CSV holds the per-session rows", capturedCsv.includes("s1,3.400000,2") && capturedCsv.includes("s2,1.100000,1"));

resetHooks();
const emptyPanel = paintWith(panelComponent, { t });
storage.delete("dsh-turn-cost.ledger.v1");
resetHooks();
const reallyEmpty = paintWith(panelComponent, { t });
check("an empty ledger renders the empty state", textOf(reallyEmpty).includes("costHistory.empty"), textOf(reallyEmpty).match(/costHistory\.empty/)?.[0]);
check("a populated ledger is not empty", emptyPanel !== null && textOf(emptyPanel).includes("s1"));

// 侧边栏图标：字形由组件自己画（侧边栏不提供兜底图标）
const iconComponent = registeredComponents[4].component;
resetHooks();
const icon = paintWith(iconComponent, { size: 18, active: true });
check("the icon draws its own glyph", icon.type === "svg" && icon.children.length === 5, icon.type + " with " + icon.children.length + " paths");
check("the icon follows the requested size", icon.props.width === 18 && icon.props.height === 18, String(icon.props.width));
check("the icon is decorative for assistive tech", icon.props["aria-hidden"] === "true");
check("the icon falls back to a default size", paintWith(iconComponent, {}).props.width === 16, String(paintWith(iconComponent, {}).props.width));

console.log(failures === 0 ? "\nALL CHECKS PASSED" : "\n" + failures + " CHECK(S) FAILED");
process.exit(failures === 0 ? 0 : 1);
