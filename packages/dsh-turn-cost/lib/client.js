window.__ModuleLoader__.load({
	id: "dsh-turn-cost",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");
		//#region 词典
		/** 词典命名空间。 */
		const NS = "turn-cost";
		/** 简体中文词典（键集以它为准）。 */
		const zh = {
			"cost.label": "花费",
			"cost.title": "本轮花费",
			"cost.uncachedInput": "未缓存输入",
			"cost.cacheRead": "缓存读取",
			"cost.cacheWrite": "缓存写入",
			"cost.output": "输出",
			"cost.reasoning": "其中推理",
			"cost.model": "模型",
			"cost.peak": "高峰时段",
			"cost.offPeak": "空闲时段",
			"cost.unit": "单价（元/百万 token）",
			"cost.tokens": "{count} tok",
			"cost.compare": "本会话中位数",
			"cost.ratio": "本轮 {ratio}×",
			"cost.hitRate": "缓存命中率",
			"cost.expensive": "花费偏高",
			"cost.veryExpensive": "花费很高",
			"cost.dearest": "本会话最贵的一轮",
			"cost.breakdown": "分步花费",
			"cost.step": "第 {step} 步 {cost}",
			"cost.moreSteps": "…另有 {count} 步",
			"cost.lowCache": "缓存命中率偏低：这些未命中比全部命中多花 {premium}",
			"cost.session": "本次会话 {cost}（{turns} 轮）",
			"cost.today": "今日 {cost}",
			"cost.week": "近 7 天 {cost}",
			"cost.summaryTitle": "按 token 单价估算，非账单",
			"cost.enlargeHint": "点击放大",
			"cost.shrinkHint": "点击还原",
			"cost.danmaku1": "好贵！{cost}",
			"cost.danmaku2": "这一轮花了 {cost}",
			"cost.danmaku3": "钱包在滴血 {cost}",
			"cost.danmakuRecord1": "破纪录了！{cost}",
			"cost.danmakuRecord2": "史上最贵的一轮 {cost}",
			"cost.danmakuBudget": "今日预算用完了！",
			"cost.danmakuTitle": "这一轮花费偏高",
			"cost.mixedPeak": "跨高峰/空闲，按各步计价",
			"cost.split": "其中输入 {input} / 输出 {output}",
			"cost.hitRateShort": "缓存命中 {rate}",
			"cost.context": "上下文 {tokens}",
			"cost.remaining": "还能跑约 {turns} 轮",
			"cost.nextEstimate": "下一轮预计 {low}~{high}",
			"cost.budget": "预算 {used}/{total}",
			"cost.budgetHint": "点击切换日预算档位（当前 {total}）",
			"cost.budgetUnset": "点击设定日预算",
			"cost.budgetOver": "今日已超预算",
			"costHistory.title": "花费历史",
			"costHistory.panel": "花费历史",
			"costHistory.subtitle": "按 token 单价估算，不是账单",
			"costHistory.export": "导出 CSV",
			"costHistory.refresh": "刷新",
			"costHistory.summary": "今日 {today} · 近 7 天 {week} · 累计 {total}",
			"costHistory.byDay": "按天",
			"costHistory.bySession": "按会话（前 20）",
			"costHistory.day": "日期",
			"costHistory.session": "会话",
			"costHistory.turns": "轮数",
			"costHistory.amount": "金额",
			"costHistory.empty": "还没有记录",
			"cost.noData": "—"
		};
		/** 与中文键集完全一致的英文词典。 */
		const en = {
			"cost.label": "Cost",
			"cost.title": "Turn cost",
			"cost.uncachedInput": "Uncached input",
			"cost.cacheRead": "Cached input",
			"cost.cacheWrite": "Cache write",
			"cost.output": "Output",
			"cost.reasoning": "of which reasoning",
			"cost.model": "Model",
			"cost.peak": "Peak hours",
			"cost.offPeak": "Off-peak hours",
			"cost.unit": "Price (CNY per million tokens)",
			"cost.tokens": "{count} tok",
			"cost.compare": "Session median",
			"cost.ratio": "This turn {ratio}×",
			"cost.hitRate": "Cache hit rate",
			"cost.expensive": "Above average cost",
			"cost.veryExpensive": "High cost",
			"cost.dearest": "Most expensive turn this session",
			"cost.breakdown": "Cost by step",
			"cost.step": "Step {step} {cost}",
			"cost.moreSteps": "…and {count} more steps",
			"cost.lowCache": "Low cache hit rate: these misses cost {premium} more than full hits",
			"cost.session": "This session {cost} ({turns} turns)",
			"cost.today": "Today {cost}",
			"cost.week": "Last 7 days {cost}",
			"cost.summaryTitle": "Estimated from token prices, not a bill",
			"cost.enlargeHint": "Click to enlarge",
			"cost.shrinkHint": "Click to shrink",
			"cost.danmaku1": "So expensive! {cost}",
			"cost.danmaku2": "This turn cost {cost}",
			"cost.danmaku3": "Ouch — {cost}",
			"cost.danmakuRecord1": "New record! {cost}",
			"cost.danmakuRecord2": "Most expensive turn ever {cost}",
			"cost.danmakuBudget": "Today's budget is gone!",
			"cost.danmakuTitle": "This turn was expensive",
			"cost.mixedPeak": "crosses peak/off-peak, priced per step",
			"cost.split": "of which input {input} / output {output}",
			"cost.hitRateShort": "cache hit {rate}",
			"cost.context": "context {tokens}",
			"cost.remaining": "about {turns} turns left",
			"cost.nextEstimate": "next turn est. {low}~{high}",
			"cost.budget": "budget {used}/{total}",
			"cost.budgetHint": "Click to cycle the daily budget (now {total})",
			"cost.budgetUnset": "Click to set a daily budget",
			"cost.budgetOver": "over today's budget",
			"costHistory.title": "Cost history",
			"costHistory.panel": "Cost history",
			"costHistory.subtitle": "Estimated from token prices, not a bill",
			"costHistory.export": "Export CSV",
			"costHistory.refresh": "Refresh",
			"costHistory.summary": "Today {today} · last 7 days {week} · all time {total}",
			"costHistory.byDay": "By day",
			"costHistory.bySession": "By session (top 20)",
			"costHistory.day": "Date",
			"costHistory.session": "Session",
			"costHistory.turns": "Turns",
			"costHistory.amount": "Amount",
			"costHistory.empty": "Nothing recorded yet",
			"cost.noData": "—"
		};
		//#endregion
		//#region 价格模型
		/*
		 * 价格来源：DeepSeek 开放平台「模型 & 价格」
		 * https://api-docs.deepseek.com/zh-cn/quick_start/pricing/
		 * 单位：元 / 百万 token。价格调整时改这里即可。
		 *
		 * 官方的输入价只区分「缓存命中」与「缓存未命中」两档；缓存写入按未命中价计费，
		 * 因此 cacheMiss 同时承担「未缓存输入」和「缓存写入」。
		 */
		const PRICING = {
			"deepseek-flash": {
				peak: { cacheHit: 0.04, cacheMiss: 2, output: 8 },
				offPeak: { cacheHit: 0.02, cacheMiss: 1, output: 4 }
			},
			"deepseek-v4-pro": {
				peak: { cacheHit: 0.3, cacheMiss: 9, output: 27 },
				offPeak: { cacheHit: 0.15, cacheMiss: 4.5, output: 13.5 }
			}
		};
		/** 认不出模型时的兜底价：按 deepseek-flash 的高峰价，宁可略高估也不低估。 */
		const FALLBACK_PRICE = PRICING["deepseek-flash"].peak;
		//#endregion
		//#region 分级配色
		/*
		 * 「花得多」有两个不同的含义，只用一个金额阈值会很难用：写代码的一轮动辄
		 * 几十次工具调用，聊两句的一轮几乎不花钱，同一个阈值对两种场景都没意义。
		 * 因此叠加两条信号：
		 *   绝对——这一轮真的贵（跨场景可比）；
		 *   相对——这一轮比你本会话平时的轮次贵得多（自适应你的用法）。
		 * 两条都不满足就沿用父级颜色，不制造彩虹。
		 */
		/*
		 * 绝对档位按「跑 agent 任务的真实量级」标定：实测本机一个长会话里，
		 * 单轮在 ¥0.15 ~ ¥1.02 之间（上下文二十多万 token、缓存命中 98% 以上）。
		 * 阈值定得太低会让每一轮都变红，颜色就失去信息量，所以取值偏保守：
		 * 到这个数才说明这一轮真的花了钱。改这四个常量就能按自己的用量重标。
		 */
		/** 绝对阈值（元）：达到即抬一档。 */
		const WARN_COST = 0.5;
		const ALERT_COST = 3;
		/** 相对阈值：达到本会话中位数的这么多倍，再抬一档。 */
		const OUTLIER_RATIO = 3;
		/** 中位数样本少于这么多轮时不做相对判定，避免拿自己跟自己比。 */
		const OUTLIER_MIN_TURNS = 4;
		//#region 缓存提示与拆解
		/*
		 * 缓存未命中的输入单价是命中价的 50 倍（flash 空闲档 ¥1 vs ¥0.02）。
		 * 一轮贵通常不是输出多，而是上下文没命中缓存，所以命中率是最该提示的信号。
		 */
		/** 命中率低于此值、且多花的钱够多时，在金额旁给一个命中提示。 */
		const LOW_HIT_RATE = 0.5;
		/** 命中提示的最小金额门槛（元），避免几厘钱也刷提示。 */
		const LOW_HIT_PREMIUM = 0.02;
		/** 明细里最多列几步 / 几个工具名，其余折叠。 */
		const BREAKDOWN_LIMIT = 5;
		/** 浏览器本地账本的存储键与保留天数（用于「今日/本周花费」）。 */
		const LEDGER_KEY = "dsh-turn-cost.ledger.v1";
		const LEDGER_KEEP_DAYS = 60;
		/** 三档颜色：0 沿用父级，1 警告，2 危险。用主题语义色，浅色/深色主题都跟着走。 */
		const TIER_COLOR = [
			void 0,
			"var(--dsw-alias-state-warn-primary, #d97706)",
			"var(--dsw-alias-state-error-primary, #dc2626)"
		];
		/**
		* 定档。
		* @param cost - 本轮花费（元）。
		* @param median - 本会话各轮花费的中位数。
		* @param count - 本会话已计价的轮数。
		* @returns 0 / 1 / 2。
		*/
		function costTier(cost, median, count) {
			let tier = 0;
			if (cost >= ALERT_COST) tier = 2;
			else if (cost >= WARN_COST) tier = 1;
			if (count >= OUTLIER_MIN_TURNS && median > 0 && cost >= median * OUTLIER_RATIO) {
				tier = Math.min(2, tier + 1);
			}
			return tier;
		}
		/**
		* 中位数。
		* @param values - 数字数组（不修改）。
		* @returns 中位数，空数组为 0。
		*/
		function medianOf(values) {
			if (values.length === 0) return 0;
			const sorted = [...values].sort((left, right) => left - right);
			const middle = Math.floor(sorted.length / 2);
			return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
		}
		/**
		* 判断某时刻是否处于高峰时段。规则：北京时间周一至周五（不含中国法定节假日）
		* 9:00-12:00、14:00-18:00 为高峰，其余（含周末与法定节假日全天）为空闲。
		* 节假日无法离线判断，只会把个别法定节假日里的高峰价算成高峰价（偏保守）。
		* @param timeMs - 毫秒时间戳。
		* @returns 是否按高峰价计费。
		*/
		function isPeakHour(timeMs) {
			const beijing = new Date(timeMs + 8 * 3600 * 1000);
			const day = beijing.getUTCDay();
			if (day === 0 || day === 6) return false;
			const hour = beijing.getUTCHours();
			return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18);
		}
		/**
		* 查单价。
		* @param model - 模型 id。
		* @param peak - 是否高峰时段。
		* @returns `{ cacheHit, cacheMiss, output }`，元/百万 token。
		*/
		function priceOf(model, peak) {
			const entry = PRICING[model];
			if (entry === undefined) return FALLBACK_PRICE;
			return peak ? entry.peak : entry.offPeak;
		}
		/**
		* 由四档 token 数算钱。
		* @param buckets - `{ uncachedInputTokens, cacheReadTokens, cacheWriteTokens, outputTokens }`。
		* @param model - 模型 id，未知则用兜底价。
		* @param timeMs - 该轮请求的毫秒时间戳，用来判定高峰/空闲。
		* @returns `{ cost, price, peak }`，cost 单位为元。
		*/
		function costOf(buckets, model, timeMs) {
			const uncached = buckets.uncachedInputTokens ?? 0;
			const cacheRead = buckets.cacheReadTokens ?? 0;
			const cacheWrite = buckets.cacheWriteTokens ?? 0;
			const output = buckets.outputTokens ?? 0;
			const peak = isPeakHour(timeMs);
			const price = priceOf(model, peak);
			const cost = (cacheRead * price.cacheHit + (uncached + cacheWrite) * price.cacheMiss + output * price.output) / 1e6;
			return { cost, price, peak };
		}
		/**
		* 金额格式：不足一元保留四位有效小数（至少两位），一元以上保留两位。
		* @param value - 元。
		* @returns 形如 `¥0.0066` 的文本。
		*/
		function formatCost(value) {
			if (!Number.isFinite(value) || value <= 0) return "¥0";
			if (value >= 1) return "¥" + value.toFixed(2);
			if (value < 0.0001) return "<¥0.0001";
			return "¥" + value.toFixed(4).replace(/(\.\d\d)0+$/, "$1");
		}
		/** 千分位整数。 */
		function formatCount(value) {
			return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
		/** 紧凑 token 数：12345 -> 12.3k，1234567 -> 1.2M。 */
		function formatTokensShort(value) {
			if (!Number.isFinite(value) || value <= 0) return "0";
			if (value >= 1e6) return (value / 1e6).toFixed(1) + "M";
			if (value >= 1e3) return (value / 1e3).toFixed(1) + "k";
			return String(Math.round(value));
		}
		/** 账户接口要求的客户端版本；取不到真实版本时的兜底值。 */
		const FALLBACK_VERSION = "0.2.0-rc.2";
		/**
		* 组装一次账户调用的身份信息（与 dsh-balance-badge 同一套契约）。
		* @param ctx - 客户端插件上下文，用于读取当前界面语言。
		* @returns 账户 RPC 需要的元数据。
		*/
		function clientMetadata(ctx) {
			let locale = "zh";
			try {
				const active = ctx.locale.getSnapshot().active;
				if (typeof active === "string" && active !== "") locale = active;
			} catch (error) {
				// 语言读取失败不阻断查询。
			}
			const desktop = globalThis.dshDesktop;
			const candidates = [desktop && desktop.clientVersion, desktop && desktop.version, globalThis.__DSH_CLIENT_VERSION__];
			let version = FALLBACK_VERSION;
			for (const candidate of candidates) {
				if (typeof candidate === "string" && candidate !== "") {
					version = candidate;
					break;
				}
			}
			return {
				version,
				locale,
				timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60
			};
		}
		//#endregion
		//#region 逐轮用量折叠
		/*
		 * 以下 fold 逐字移植自 @deepseek-ai/dsh-token-meter 的
		 * lib/types/turn-usage.js（0.2.0-rc.2）。该包虽然导出浏览器安全的
		 * `./client`，却没有 dsh.client 声明，不是 boot-graph 里的行，插件的
		 * 浏览器半边无法 require 它，因此内联；两者算法必须保持一致。
		 */
		function isCount(value) {
			return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
		}
		function safeSum(values) {
			let total = 0;
			for (const value of values) {
				total += value;
				if (!Number.isSafeInteger(total)) return void 0;
			}
			return total;
		}
		function messageRoute(message) {
			const { provider, model } = message.source;
			return provider.length > 0 && model.length > 0 ? { provider, model } : void 0;
		}
		/** 一次结算流里最后一个未打包的指定类型分片。 */
		function lastAssistantStreamChunk(stream, type) {
			for (let index = stream.length - 1; index >= 0; index -= 1) {
				const record = stream[index];
				if (record.type === "chunk" && record.chunk.type === type) return record.chunk;
			}
		}
		function streamUsage(stream) {
			const chunk = lastAssistantStreamChunk(stream, "usage");
			return chunk === void 0 ? void 0 : chunk.usage;
		}
		function normalizeUsage(usage, route) {
			const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens, totalTokens } = usage;
			if (!isCount(inputTokens) || !isCount(outputTokens)) return void 0;
			if (cacheReadTokens !== void 0 && !isCount(cacheReadTokens)) return void 0;
			if (cacheWriteTokens !== void 0 && !isCount(cacheWriteTokens)) return void 0;
			if (reasoningTokens !== void 0 && (!isCount(reasoningTokens) || reasoningTokens > outputTokens)) return void 0;
			const knownPrompt = safeSum([
				inputTokens,
				...(cacheReadTokens === void 0 ? [] : [cacheReadTokens]),
				...(cacheWriteTokens === void 0 ? [] : [cacheWriteTokens])
			]);
			if (knownPrompt === void 0) return void 0;
			let exactTotal;
			if (totalTokens !== void 0) {
				if (!isCount(totalTokens)) return void 0;
				const exactPrompt = totalTokens - outputTokens;
				if (!isCount(exactPrompt) || exactPrompt < knownPrompt) return void 0;
				if (cacheReadTokens !== void 0 && cacheWriteTokens !== void 0 && exactPrompt !== knownPrompt) return void 0;
				exactTotal = totalTokens;
			} else {
				if (cacheReadTokens === void 0 || cacheWriteTokens === void 0) return void 0;
				const derivedTotal = safeSum([knownPrompt, outputTokens]);
				if (derivedTotal === void 0) return void 0;
				exactTotal = derivedTotal;
			}
			return {
				inputTokens,
				outputTokens,
				totalTokens: exactTotal,
				...(cacheReadTokens === void 0 ? {} : { cacheReadTokens }),
				...(cacheWriteTokens === void 0 ? {} : { cacheWriteTokens }),
				...(reasoningTokens === void 0 ? {} : { reasoningTokens }),
				...(route === void 0 ? {} : { route })
			};
		}
		function aggregateAttempts(attempts) {
			if (attempts.length === 0) return void 0;
			const inputTokens = safeSum(attempts.map((attempt) => attempt.inputTokens));
			const outputTokens = safeSum(attempts.map((attempt) => attempt.outputTokens));
			const totalTokens = safeSum(attempts.map((attempt) => attempt.totalTokens));
			if (inputTokens === void 0 || outputTokens === void 0 || totalTokens === void 0) return void 0;
			const cacheRead = attempts.map((attempt) => attempt.cacheReadTokens);
			const cacheWrite = attempts.map((attempt) => attempt.cacheWriteTokens);
			const reasoning = attempts.map((attempt) => attempt.reasoningTokens);
			const cacheReadTokens = cacheRead.every(isCount) ? safeSum(cacheRead) : void 0;
			const cacheWriteTokens = cacheWrite.every(isCount) ? safeSum(cacheWrite) : void 0;
			const reasoningTokens = reasoning.every(isCount) ? safeSum(reasoning) : void 0;
			let routes;
			const attributed = attempts.map((attempt) => attempt.route);
			if (attributed.every((route) => route !== void 0)) {
				const unique = new Map();
				for (const route of attributed) unique.set(`${route.provider}\0${route.model}`, route);
				routes = [...unique.values()];
			}
			return {
				uncachedInputTokens: inputTokens,
				outputTokens,
				totalTokens,
				...(cacheReadTokens === void 0 ? {} : { cacheReadTokens }),
				...(cacheWriteTokens === void 0 ? {} : { cacheWriteTokens }),
				...(reasoningTokens === void 0 ? {} : { reasoningTokens }),
				...(routes === void 0 ? {} : { routes })
			};
		}
		function sameAttempt(state, turn, step) {
			return state.turn === turn && state.step === step;
		}
		/**
		* 把一个完整轮次的持久事件折叠成精确 token 记账。任何缺失的生命周期边界、
		* 不完整用量、不安全计数或自相矛盾的精确总量，都会让整轮结果不可用。
		* @param events - 从 `turn/start` 到 `turn/end` 的该轮事件。
		* @returns 精确聚合用量，无法证明时为 undefined。
		*/
		function deriveTurnTokenUsage(events) {
			let state = { kind: "idle" };
			const attempts = [];
			let turn;
			let sawEnd = false;
			let invalid = false;
			const closeOpen = (route) => {
				if (state.kind !== "open" || state.sample === void 0) return false;
				const normalized = normalizeUsage(state.sample, route);
				if (normalized === void 0) return false;
				attempts.push(normalized);
				return true;
			};
			for (const event of events) {
				if (invalid) break;
				if (event.type === "turn/start") {
					if (turn !== void 0 || state.kind !== "idle") invalid = true;
					else turn = event.data.turn;
					continue;
				}
				if (turn === void 0) {
					invalid = true;
					break;
				}
				if (event.type === "turn/end") {
					if (event.data.turn !== turn || state.kind !== "idle" || sawEnd) invalid = true;
					else sawEnd = true;
					continue;
				}
				if (sawEnd) {
					invalid = true;
					break;
				}
				if (event.type === "step/start") {
					if (event.data.turn !== turn || state.kind !== "idle") invalid = true;
					else state = { kind: "open", turn, step: event.data.step };
					continue;
				}
				if (event.type === "llm/retry-started") {
					if (event.data.turn !== turn || state.kind !== "settled" || state.by !== "retry" || !sameAttempt(state, event.data.turn, event.data.step)) invalid = true;
					else state = { kind: "open", turn, step: event.data.step };
					continue;
				}
				if (event.type === "assistant/attempt") {
					if (event.data.turn !== turn || state.kind !== "open" || !sameAttempt(state, event.data.turn, event.data.step)) {
						invalid = true;
						continue;
					}
					const sample = streamUsage(event.data.stream) ?? state.sample;
					state = { kind: "open", turn, step: event.data.step, ...(sample === void 0 ? {} : { sample }) };
					if (!closeOpen()) invalid = true;
					else state = { kind: "finishClosed", turn, step: event.data.step };
					continue;
				}
				if (event.type === "assistant/message") {
					if (event.data.turn !== turn || state.kind !== "open" || !sameAttempt(state, event.data.turn, event.data.step)) {
						invalid = true;
						continue;
					}
					const sample = event.data.usage ?? streamUsage(event.data.stream);
					if (sample !== void 0) state = { ...state, sample };
					if (!closeOpen(messageRoute(event.data.message))) invalid = true;
					else state = { kind: "settled", turn, step: event.data.step, by: "message" };
					continue;
				}
				if (event.type === "llm/retry") {
					if (event.data.turn !== turn || state.kind === "idle" || !sameAttempt(state, event.data.turn, event.data.step)) {
						invalid = true;
						continue;
					}
					if (state.kind === "settled" || (state.kind === "open" && !closeOpen())) invalid = true;
					if (!invalid) state = { kind: "settled", turn, step: event.data.step, by: "retry" };
					continue;
				}
				if (event.type === "step/end") {
					if (event.data.turn !== turn || state.kind === "idle" || !sameAttempt(state, event.data.turn, event.data.step)) {
						invalid = true;
						continue;
					}
					if (state.kind === "open" && !closeOpen()) invalid = true;
					if (!invalid) state = { kind: "idle" };
				}
			}
			return invalid || !sawEnd || state.kind !== "idle" ? void 0 : aggregateAttempts(attempts);
		}
		//#endregion
		//#region 会话事件索引
		/**
		* 把一个 turn 的跨度拆成每一步的花费与工具调用。
		*
		* 每一步的花费取该步内 assistant/message 自己上报的用量之和——这是提供方对
		* 那一次请求的记账，正好回答「哪一步、哪个工具把钱烧了」。严格整轮折叠还会
		* 处理重试，所以分步之和与整轮数字可能有细微差别（重试），这是预期的。
		* @param events - 该 turn 的事件（含 turn/start 与 turn/end）。
		* @param start - 起始下标。
		* @param end - 结束下标（含）。
		* @returns `[{ step, cost, tokens, tools }]`。
		*/
		function stepsOf(events, start, end) {
			const steps = [];
			let current = null;
			const close = () => {
				if (current === null) return;
				const total = current.input + current.read + current.write + current.output;
				if (total > 0) {
					const priced = costOf({
						uncachedInputTokens: current.input,
						cacheReadTokens: current.read,
						cacheWriteTokens: current.write,
						outputTokens: current.output
					}, current.model, current.timeMs);
					steps.push({
						step: current.step,
						cost: priced.cost,
						tokens: total,
						peak: priced.peak,
						price: priced.price,
						tools: [...current.tools.entries()].map(([name, count]) => ({ name, count }))
					});
				}
				current = null;
			};
			for (let i = start; i <= end && i < events.length; i += 1) {
				const event = events[i];
				if (event.type === "step/start") {
					close();
					current = {
						step: event.data.step,
						input: 0,
						read: 0,
						write: 0,
						output: 0,
						tools: new Map(),
						model: void 0,
						timeMs: toMillis(event.time)
					};
					continue;
				}
				if (event.type === "step/end") {
					close();
					continue;
				}
				if (current === null) continue;
				if (event.type === "assistant/message") {
					const usage = event.data.usage ?? streamUsage(event.data.stream);
					if (usage !== void 0) {
						current.input += usage.inputTokens ?? 0;
						current.read += usage.cacheReadTokens ?? 0;
						current.write += usage.cacheWriteTokens ?? 0;
						current.output += usage.outputTokens ?? 0;
						const route = messageRoute(event.data.message);
						if (route !== void 0) current.model = route.model;
						current.timeMs = toMillis(event.time);
					}
					continue;
				}
				if (event.type === "tool/call") {
					const name = typeof event.data.name === "string" && event.data.name !== "" ? event.data.name : "?";
					current.tools.set(name, (current.tools.get(name) ?? 0) + 1);
				}
			}
			close();
			return steps;
		}
		/**
		* 从会话事件窗口里抽出「收尾的那条回答」的 messageId 与该轮用量和花费。
		*
		* 一个 turn 可能包含多个 step（工具调用往返），每条 assistant/message 都是一个
		* 节点；对话页脚只挂在收尾那条上（ui-chat 取 `closing.finalNode`），因此这里
		* 也把整轮用量记到该轮**最后一条**带 id 的 assistant/message 上，避免重复计费。
		*
		* 顺带算出本会话各轮花费的中位数与最大值，供分级配色做相对判定。
		* @param entries - `session.eventSource` 快照里的 entries。
		* @returns `{ byMessage, median, max, count }`。
		*/
		function buildUsageIndex(entries) {
			const byMessage = new Map();
			const costs = [];
			let max = 0;
			if (!Array.isArray(entries)) return { byMessage, median: 0, max: 0, count: 0 };
			const events = [];
			for (const entry of entries) {
				if (entry === null || typeof entry !== "object") continue;
				// 流式期间的临时行没有持久用量，跳过。
				if (entry.type === "transient") continue;
				const event = entry.event;
				if (event === null || typeof event !== "object" || typeof event.type !== "string") continue;
				// 客户端专有的流式分片（seq 还是分数），折叠算法不认识，必须排除。
				if (event.type === "assistant/live-chunk") continue;
				events.push(event);
			}
			let start = -1;
			for (let i = 0; i < events.length; i += 1) {
				const type = events[i].type;
				if (type === "turn/start") {
					start = i;
					continue;
				}
				if (type !== "turn/end") continue;
				if (start >= 0) {
					const usage = deriveTurnTokenUsage(events.slice(start, i + 1));
					if (usage !== void 0) {
						let closing;
						for (let k = start; k <= i; k += 1) {
							const candidate = events[k];
							if (candidate.type !== "assistant/message") continue;
							const data = candidate.data;
							const id = data && data.message && data.message.id;
							if (typeof id === "string" && id !== "") closing = { id, time: candidate.time };
						}
						if (closing !== void 0 && !byMessage.has(closing.id)) {
							const model = Array.isArray(usage.routes) && usage.routes.length > 0 ? usage.routes[0].model : void 0;
							const timeMs = toMillis(closing.time);
							const priced = costOf(usage, model, timeMs);
							const steps = stepsOf(events, start, i);
							const read = usage.cacheReadTokens ?? 0;
							const missTokens = usage.uncachedInputTokens + (usage.cacheWriteTokens ?? 0);
							const promptTokens = read + missTokens;
							const wholeTokens = promptTokens + usage.outputTokens;
							const stepTokens = steps.reduce((sum, step) => sum + step.tokens, 0);
							// 跨高峰/空闲边界时，逐步按各自的时间计价才准；只有分步覆盖到
							// 与整轮同一批 token 时才敢用（重试会让两者不等，那就退回整轮价）。
							const perStep = steps.length > 0 && stepTokens === wholeTokens;
							const distinctPeaks = new Set(steps.map((step) => step.peak));
							byMessage.set(closing.id, {
								usage,
								time: closing.time,
								timeMs,
								model,
								cost: perStep ? steps.reduce((sum, step) => sum + step.cost, 0) : priced.cost,
								price: priced.price,
								// 跨越边界时没有单一档位，用 undefined 表示「混合」。
								peak: perStep && distinctPeaks.size > 1 ? void 0 : priced.peak,
								mixedPeak: perStep && distinctPeaks.size > 1,
								perStep,
								// 命中率，以及「这些未命中如果全命中会省多少」。
								hitRate: promptTokens > 0 ? read / promptTokens : void 0,
								premium: missTokens * (priced.price.cacheMiss - priced.price.cacheHit) / 1e6,
								// 输入与输出各自的金额，用来说明「钱花在上下文还是回答上」。
								inputCost: (missTokens * priced.price.cacheMiss + read * priced.price.cacheHit) / 1e6,
								outputCost: usage.outputTokens * priced.price.output / 1e6,
								steps
							});
							costs.push(byMessage.get(closing.id).cost);
							if (byMessage.get(closing.id).cost > max) max = byMessage.get(closing.id).cost;
						}
					}
				}
				start = -1;
			}
			return { byMessage, median: medianOf(costs), max, count: costs.length };
		}
		/**
		* 每个事件窗口快照只建一次索引；同一窗口下所有回答共用同一份 entries 引用。
		* @param entries - 事件窗口快照的 entries。
		* @returns `{ byMessage, median, max, count }`。
		*/
		const indexCache = new WeakMap();
		function usageIndexFor(entries) {
			if (entries === null || typeof entries !== "object") return { byMessage: new Map(), median: 0, max: 0, count: 0 };
			let index = indexCache.get(entries);
			if (index === void 0) {
				index = buildUsageIndex(entries);
				indexCache.set(entries, index);
			}
			return index;
		}
		/**
		* 会话事件的时间字段可能是秒或毫秒，统一成毫秒。
		* @param time - 事件时间。
		* @returns 毫秒时间戳。
		*/
		function toMillis(time) {
			if (typeof time !== "number" || !Number.isFinite(time)) return Date.now();
			return time > 1e11 ? time : time * 1000;
		}
		//#endregion
		//#region 花费账本（浏览器本地）
		/*
		 * 「今日 / 本周花了多少」要跨会话、跨刷新留存，所以记在浏览器本地。
		 * 每条轮次按 `<sessionId>:<messageId>` 去重；同一轮的花费若变化（重试），
		 * 先把旧值从当天扣掉再加新值，绝不重复累加。
		 */
		/**
		* 本地日期键。
		* @param timeMs - 毫秒时间戳。
		* @returns `YYYY-MM-DD`。
		*/
		function dayKeyOf(timeMs) {
			const date = new Date(timeMs);
			const pad = (value) => (value < 10 ? "0" : "") + value;
			return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
		}
		/**
		* 往今天之前数第 n 天的日期键。
		* @param back - 回溯天数。
		* @returns `YYYY-MM-DD`。
		*/
		function dayKeyBack(back) {
			const date = new Date();
			date.setDate(date.getDate() - back);
			return dayKeyOf(date.getTime());
		}
		/**
		* 读账本；解析失败或版本不符就重来一份，绝不让坏数据卡住界面。
		* @returns 账本对象。
		*/
		function loadLedger() {
			try {
				const raw = globalThis.localStorage === void 0 ? null : globalThis.localStorage.getItem(LEDGER_KEY);
				if (raw !== null && raw !== void 0) {
					const parsed = JSON.parse(raw);
					if (parsed !== null && typeof parsed === "object" && parsed.version === 1 && typeof parsed.days === "object" && typeof parsed.seen === "object") return parsed;
				}
			} catch (error) {
				// 本地存储不可用（隐私模式等）时退化成「只在内存里记」。
			}
			return { version: 1, days: {}, seen: {} };
		}
		/**
		* 写账本。
		* @param ledger - 账本对象。
		*/
		function saveLedger(ledger) {
			try {
				if (globalThis.localStorage !== void 0) globalThis.localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
			} catch (error) {
				// 写不进去也不影响本次会话内的显示。
			}
		}
		/**
		* 丢掉过期的明细与日期，避免账本无限增长。
		* @param ledger - 账本对象（就地修改）。
		*/
		function pruneLedger(ledger) {
			const oldest = dayKeyBack(LEDGER_KEEP_DAYS);
			for (const [key, entry] of Object.entries(ledger.seen)) {
				if (entry === null || typeof entry !== "object" || typeof entry.day !== "string" || entry.day < oldest) delete ledger.seen[key];
			}
			for (const day of Object.keys(ledger.days)) if (day < oldest) delete ledger.days[day];
		}
		/**
		* 把一个会话索引里的所有轮次记进账本。
		* @param sessionId - 会话 id。
		* @param index - `usageIndexFor` 的产物。
		* @returns 记完账之后的账本。
		*/
		function accountSession(sessionId, index) {
			const ledger = loadLedger();
			let changed = false;
			for (const [messageId, record] of index.byMessage) {
				const key = sessionId + ":" + messageId;
				const day = dayKeyOf(record.timeMs);
				const previous = ledger.seen[key];
				if (previous !== void 0 && previous.day === day && previous.cost === record.cost) continue;
				if (previous !== void 0) ledger.days[previous.day] = (ledger.days[previous.day] ?? 0) - previous.cost;
				ledger.seen[key] = { day, cost: record.cost, session: sessionId };
				ledger.days[day] = (ledger.days[day] ?? 0) + record.cost;
				changed = true;
			}
			if (changed) {
				pruneLedger(ledger);
				saveLedger(ledger);
			}
			return ledger;
		}
		/**
		* 最近若干天的合计。
		* @param ledger - 账本。
		* @param days - 含今天在内的天数。
		* @returns 合计金额（元）。
		*/
		function recentTotal(ledger, days) {
			let total = 0;
			for (let back = 0; back < days; back += 1) total += ledger.days[dayKeyBack(back)] ?? 0;
			return total;
		}
		//#endregion
		//#region 日预算
		/*
		 * 预算不设配置文件，就存在浏览器本地；点汇总那一行循环切换档位。
		 * 档位用固定几档而不是任意输入：Electron 里没有 window.prompt，
		 * 为这个再做一个设置页不划算。
		 */
		/** 预算的本地存储键。 */
		const BUDGET_KEY = "dsh-turn-cost.budget.v1";
		/** 可循环的档位，0 表示不设预算。 */
		const BUDGET_STEPS = [0, 5, 10, 20, 50, 100];
		/**
		* 读日预算。
		* @returns 金额（元），未设为 0。
		*/
		function readBudget() {
			try {
				const raw = globalThis.localStorage === void 0 ? null : globalThis.localStorage.getItem(BUDGET_KEY);
				const value = Number(raw);
				return Number.isFinite(value) && value > 0 ? value : 0;
			} catch (error) {
				return 0;
			}
		}
		/**
		* 切到下一档日预算。
		* @returns 切换后的金额（元），0 表示关。
		*/
		function cycleBudget() {
			const current = readBudget();
			const at = BUDGET_STEPS.indexOf(current);
			const next = BUDGET_STEPS[(at + 1) % BUDGET_STEPS.length];
			try {
				if (globalThis.localStorage !== void 0) globalThis.localStorage.setItem(BUDGET_KEY, String(next));
			} catch (error) {
				// 存不下也不影响本次显示。
			}
			return next;
		}
		/**
		* 今天的预算告警是否已经放过了。
		* @param ledger - 账本。
		* @returns 是否已告警。
		*/
		function budgetAlertedToday(ledger) {
			return ledger.alerted !== void 0 && ledger.alerted[dayKeyBack(0)] === true;
		}
		/**
		* 记下今天已告警，避免每次事件都重放。
		* @param ledger - 账本（就地修改并落盘）。
		*/
		function markBudgetAlerted(ledger) {
			ledger.alerted = { ...(ledger.alerted ?? {}), [dayKeyBack(0)]: true };
			saveLedger(ledger);
		}
		//#endregion
		//#region 花费历史
		/**
		* 把账本摊成按天、按会话两种视图。
		* @param ledger - 账本。
		* @returns `{ days, sessions, total }`，都按金额从大到小。
		*/
		function historyOf(ledger) {
			const byDay = new Map();
			const bySession = new Map();
			let total = 0;
			for (const entry of Object.values(ledger.seen ?? {})) {
				if (entry === null || typeof entry !== "object" || typeof entry.cost !== "number") continue;
				const day = typeof entry.day === "string" ? entry.day : "?";
				const session = typeof entry.session === "string" ? entry.session : "?";
				const dayRow = byDay.get(day) ?? { key: day, cost: 0, turns: 0 };
				dayRow.cost += entry.cost;
				dayRow.turns += 1;
				byDay.set(day, dayRow);
				const sessionRow = bySession.get(session) ?? { key: session, cost: 0, turns: 0 };
				sessionRow.cost += entry.cost;
				sessionRow.turns += 1;
				bySession.set(session, sessionRow);
				total += entry.cost;
			}
			const sort = (rows) => [...rows.values()].sort((left, right) => right.cost - left.cost);
			return { days: sort(byDay).sort((left, right) => right.key.localeCompare(left.key)), sessions: sort(bySession), total };
		}
		/**
		* 生成导出用的 CSV。带 BOM，Excel 打开不乱码。
		* @param ledger - 账本。
		* @returns CSV 文本。
		*/
		function historyCsv(ledger) {
			const view = historyOf(ledger);
			const lines = ["日期,金额(元),轮数"];
			for (const row of view.days) lines.push(row.key + "," + row.cost.toFixed(6) + "," + row.turns);
			lines.push("");
			lines.push("会话,金额(元),轮数");
			for (const row of view.sessions) lines.push(row.key + "," + row.cost.toFixed(6) + "," + row.turns);
			return "\uFEFF" + lines.join("\r\n");
		}
		/**
		* 触发一次浏览器下载。
		* @param filename - 文件名。
		* @param text - 内容。
		* @returns 是否成功发起。
		*/
		function downloadText(filename, text) {
			try {
				const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
				const anchor = document.createElement("a");
				anchor.href = url;
				anchor.download = filename;
				document.body.appendChild(anchor);
				anchor.click();
				document.body.removeChild(anchor);
				setTimeout(() => URL.revokeObjectURL(url), 1000);
				return true;
			} catch (error) {
				return false;
			}
		}
		//#endregion
		//#region 放大显示
		/*
		 * 页脚那行字号很小，点一下把金额放大。
		 * 做成「一处点击、全部放大」并记住偏好：不然每条回答都要点一次；
		 * 再点一次（任意一条）还原。
		 */
		/** 放大偏好的本地存储键。 */
		const ENLARGE_KEY = "dsh-turn-cost.enlarged.v1";
		/** 放大后的字号倍数与字重。 */
		const ENLARGE_SCALE = 1.6;
		/** 订阅放大状态的组件。 */
		const enlargeListeners = new Set();
		/** 当前是否放大。 */
		let enlargeState = (() => {
			try {
				return globalThis.localStorage !== void 0 && globalThis.localStorage.getItem(ENLARGE_KEY) === "1";
			} catch (error) {
				return false;
			}
		})();
		/**
		* 切换并广播放大状态。
		* @param next - 目标状态。
		*/
		function setEnlarged(next) {
			if (enlargeState === next) return;
			enlargeState = next;
			try {
				if (globalThis.localStorage !== void 0) globalThis.localStorage.setItem(ENLARGE_KEY, next ? "1" : "0");
			} catch (error) {
				// 记不住偏好不影响本次点击的效果。
			}
			for (const listener of [...enlargeListeners]) {
				try {
					listener();
				} catch (error) {
					// 单个订阅者出错不影响其它组件。
				}
			}
		}
		/**
		* 订阅放大状态的钩子。
		* @returns 当前是否放大。
		*/
		function useEnlarged() {
			const [value, setValue] = React.useState(enlargeState);
			React.useEffect(() => {
				const listener = () => setValue(enlargeState);
				enlargeListeners.add(listener);
				listener();
				return () => {
					enlargeListeners.delete(listener);
				};
			}, []);
			return value;
		}
		//#endregion
		//#region 好贵弹幕
		/*
		 * 一轮花到阈值以上时，往全屏浮层（shell.overlay）里放一批从右往左飘的弹幕，
		 * 铺满屏。触发在「回答页脚」那一侧，渲染在浮层那一侧，中间用一个模块级事件
		 * 总线连接——页脚拿得到该轮花费，浮层才拿得到全屏坐标系。
		 */
		/** 触发弹幕的单轮金额门槛（元）。 */
		const DANMAKU_COST = 1;
		/** 一次铺多少条：随金额增长，从 12 条到 48 条封顶。 */
		const DANMAKU_MIN = 12;
		const DANMAKU_MAX = 48;
		/** 两次弹幕之间的最短间隔（毫秒），避免连续几轮都贵时刷屏。预算告警不受此限。 */
		const DANMAKU_COOLDOWN_MS = 30000;
		/** 是否在弹幕时"叮"一声（用 AudioContext 现场合成，不需要音频文件）。 */
		const DANMAKU_SOUND = true;
		/** 文案键，轮着用；破纪录时换另一组。 */
		const DANMAKU_KEYS = ["cost.danmaku1", "cost.danmaku2", "cost.danmaku3"];
		const DANMAKU_RECORD_KEYS = ["cost.danmakuRecord1", "cost.danmakuRecord2"];
		/** 文字颜色，挑的都是深浅主题下都看得清的亮色。 */
		const DANMAKU_COLORS = ["#ff5c5c", "#ffb020", "#4da3ff", "#42d392", "#c77dff"];
		/** 弹幕样式表 + 让它独占一行的布局样式，注入一次。 */
		const DANMAKU_CSS = [
			"@keyframes dsh-turn-cost-fly{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}",
			".dsh-turn-cost-danmaku{position:absolute;inset:0;overflow:hidden;pointer-events:none}",
			".dsh-turn-cost-danmaku>span{position:absolute;left:0;white-space:nowrap;font-weight:700;",
			"text-shadow:0 1px 2px rgba(0,0,0,.55),0 0 12px rgba(0,0,0,.35);",
			"animation-name:dsh-turn-cost-fly;animation-timing-function:linear;animation-fill-mode:both}",
			/*
			 * 输入框下方那条 dock 是不换行的横向 flex（gap:12px、justify-content:center），
			 * 汇总会和 DSH 自己的统计胶囊挤在同一行。这里让它换行，汇总那一项自己占满一行
			 * 落到下面。选择器不依赖哈希类名：`[class*="_dock"]` 用的是 CSS Module 的稳定
			 * 后缀，`:has(...)` 再限定成「包含汇总的那一个」。
			 */
			"[class*=\"_dock\"]:has([data-turn-cost-summary]){flex-wrap:wrap}"
		].join("");
		/**
		* 把样式表插到 head；重复调用只插一次（带 data-plugin 标记，卸载时可回收）。
		*/
		function installStyles() {
			if (typeof document === "undefined") return;
			const tagId = "dsh-turn-cost/styles.css";
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-turn-cost";
			tag.dataset.pluginCss = tagId;
			tag.textContent = DANMAKU_CSS;
			document.head.appendChild(tag);
		}
		/** 弹幕订阅者。 */
		const danmakuListeners = new Set();
		/** 弹幕自增 id。 */
		let danmakuSeq = 0;
		/**
		* 订阅弹幕批次。
		* @param listener - 收到一批弹幕项。
		* @returns 退订函数。
		*/
		function subscribeDanmaku(listener) {
			danmakuListeners.add(listener);
			return () => {
				danmakuListeners.delete(listener);
			};
		}
		/**
		* 造一批铺满屏的弹幕项。
		*
		* 行高、时长、字号、延迟都用「乘一个质数再取模」铺开，不用随机数：
		* 分布够散，又是确定的，测试里能断言。
		* @param text - 文案。
		* @param index - 批次序号，用来错开文案与配色。
		* @param count - 这一批多少条。
		* @returns 弹幕项数组。
		*/
		function danmakuBatch(text, index, count) {
			const items = [];
			for (let i = 0; i < count; i += 1) {
				const slot = (i * 7 + index * 3) % count;
				items.push({
					id: ++danmakuSeq,
					text,
					top: 4 + (slot * 88) / count,
					duration: 5 + ((i * 5 + index) % 5),
					delay: ((i * 11) % 9) * 0.22,
					size: 16 + ((i * 3) % 4) * 6,
					color: DANMAKU_COLORS[(i + index) % DANMAKU_COLORS.length]
				});
			}
			return items;
		}
		/**
		* 金额换算这一批放多少条。
		* @param cost - 本轮花费（元）。
		* @returns 条数。
		*/
		function danmakuCountFor(cost) {
			const raw = DANMAKU_MIN + Math.round((cost / DANMAKU_COST) * 12);
			return Math.max(DANMAKU_MIN, Math.min(DANMAKU_MAX, raw));
		}
		/** 上一次弹幕的时间戳。 */
		let lastDanmakuAt = 0;
		/** 复用同一个音频上下文。 */
		let audioContext;
		/** "叮"一声。合成两个短正弦音，失败就安静。 */
		function playChime() {
			if (!DANMAKU_SOUND) return;
			try {
				const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
				if (Ctor === void 0) return;
				audioContext ??= new Ctor();
				if (audioContext.state === "suspended") {
					const resumed = audioContext.resume();
					if (resumed !== void 0 && typeof resumed.catch === "function") resumed.catch(() => {});
				}
				const start = audioContext.currentTime;
				for (const [offset, frequency] of [[0, 880], [0.12, 1320]]) {
					const oscillator = audioContext.createOscillator();
					const gain = audioContext.createGain();
					oscillator.type = "sine";
					oscillator.frequency.value = frequency;
					gain.gain.setValueAtTime(0.0001, start + offset);
					gain.gain.exponentialRampToValueAtTime(0.1, start + offset + 0.01);
					gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
					oscillator.connect(gain);
					gain.connect(audioContext.destination);
					oscillator.start(start + offset);
					oscillator.stop(start + offset + 0.2);
				}
			} catch (error) {
				// 没有声音不影响别的。
			}
		}
		/**
		* 放一批弹幕。
		* @param text - 文案。
		* @param count - 条数。
		* @param force - 跳过冷却（预算告警用）。
		* @returns 是否真的放了。
		*/
		function fireDanmaku(text, count, force) {
			if (danmakuListeners.size === 0) return false;
			const now = Date.now();
			if (force !== true && now - lastDanmakuAt < DANMAKU_COOLDOWN_MS) return false;
			lastDanmakuAt = now;
			const items = danmakuBatch(text, danmakuSeq, count);
			for (const listener of [...danmakuListeners]) {
				try {
					listener(items);
				} catch (error) {
					// 单个订阅者出错不影响其它订阅者。
				}
			}
			playChime();
			return true;
		}
		/** 每个会话的播报状态：已播报过的轮次，避免刷新后把历史重播一遍。 */
		const announcedTurns = new Map();
		/**
		* 判断这一轮要不要放弹幕，并记账。
		*
		* 首次见到一个会话时只「登记」已有轮次、不播报，否则打开页面就会被几十条历史
		* 弹幕糊住；之后只有新完成的、金额过线的轮次才播。
		* @param sessionId - 会话 id。
		* @param index - 该会话的用量索引。
		* @param messageId - 这一轮的收尾回答 id。
		* @param cost - 该轮花费（元）。
		* @param t - 词典函数。
		*/
		function announceTurn(sessionId, index, messageId, cost, t) {
			let state = announcedTurns.get(sessionId);
			if (state === void 0) {
				// 首次见到这个会话：只登记，并把历史最高价当基准，
				// 免得刚打开页面就把历史里的最高价报成「破纪录」。
				let best = 0;
				for (const record of index.byMessage.values()) if (record.cost > best) best = record.cost;
				announcedTurns.set(sessionId, { seen: new Set(index.byMessage.keys()), fired: 0, best });
				return;
			}
			if (state.seen.has(messageId)) return;
			state.seen.add(messageId);
			if (cost < DANMAKU_COST) return;
			const record = cost > state.best;
			const keys = record ? DANMAKU_RECORD_KEYS : DANMAKU_KEYS;
			const text = t(keys[state.fired % keys.length], { cost: formatCost(cost) });
			if (record) state.best = cost;
			if (fireDanmaku(text, danmakuCountFor(cost), false)) state.fired += 1;
		}
		/**
		* 造全屏弹幕浮层组件。挂在 shell.overlay，不接收任何 owner props。
		* @returns React 组件。
		*/
		function createDanmakuLayer() {
			/**
			* 铺满屏的弹幕层。整层 pointer-events:none，绝不挡住底下的界面操作。
			* @param props - 框架给的 `t`。
			* @returns 浮层元素，没有弹幕时不渲染。
			*/
			function DanmakuLayer(props) {
				const t = props.t;
				const [items, setItems] = React.useState([]);
				React.useEffect(() => {
					installStyles();
					// 系统开了「减少动态效果」就不放，免得帮倒忙。
					if (typeof globalThis.matchMedia === "function" && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
					return subscribeDanmaku((batch) => {
						setItems((previous) => [...previous, ...batch]);
						const longest = batch.reduce((max, item) => Math.max(max, item.delay + item.duration), 0);
						globalThis.setTimeout(() => {
							const ids = new Set(batch.map((item) => item.id));
							setItems((previous) => previous.filter((item) => !ids.has(item.id)));
						}, longest * 1000 + 500);
					});
				}, []);
				if (items.length === 0) return null;
				return React.createElement("div", {
					className: "dsh-turn-cost-danmaku",
					"data-turn-cost-danmaku": items.length,
					"aria-hidden": "true",
					title: t("cost.danmakuTitle"),
					style: { pointerEvents: "none" }
				}, items.map((item) => React.createElement("span", {
					key: item.id,
					style: {
						top: item.top + "%",
						fontSize: item.size + "px",
						color: item.color,
						animationDuration: item.duration + "s",
						animationDelay: item.delay + "s"
					}
				}, item.text)));
			}
			return DanmakuLayer;
		}
		//#endregion
		//#region 组件
		/** 事件索引里的一轮用量加一个 messageId。 */
		function createTurnCostPill(ctx) {
			/**
			* 每条回答页脚里的花费小标签。
			* @param props - 父级给的 `messageId`、框架给的 `useEvents` 与 `t`。
			* @returns 标签元素，拿不到该轮用量时不渲染。
			*/
			function TurnCostPill(props) {
				const t = props.t;
				const entries = props.useEvents((snapshot) => snapshot.entries);
				const enlarged = useEnlarged();
				const index = React.useMemo(() => usageIndexFor(entries), [entries]);
				const found = index.byMessage.get(props.messageId);
				// 新完成的、金额过线的轮次放一批弹幕；历史轮次只在首次登记、不播报。
				React.useEffect(() => {
					if (found === void 0) return;
					announceTurn(props.sessionId, index, props.messageId, found.cost, t);
				}, [props.sessionId, props.messageId, index]);
				if (found === void 0) return null;
				const tier = costTier(found.cost, index.median, index.count);
				const ratio = index.median > 0 && index.count >= OUTLIER_MIN_TURNS ? found.cost / index.median : void 0;
				const dearest = index.count > 1 && found.cost >= index.max;
				// 缓存没命中是这一轮贵的主因；只有多花的钱够多时才在金额旁提示，免得每行都挂个牌子。
				const lowCache = found.hitRate !== void 0 && found.hitRate < LOW_HIT_RATE && found.premium >= LOW_HIT_PREMIUM;
				const tokenLine = (key, count) => count === void 0 ? void 0 : t(key) + " " + t("cost.tokens", { count: formatCount(count) });
				// 分步拆解：按花费从大到小排，最多列几步，其余折叠成一行。
				const allSteps = found.steps ?? [];
				const shownSteps = [...allSteps].sort((left, right) => right.cost - left.cost).slice(0, BREAKDOWN_LIMIT);
				const stepLines = shownSteps.map((step) => {
					const tools = step.tools.slice(0, BREAKDOWN_LIMIT).map((tool) => tool.count > 1 ? tool.name + " ×" + tool.count : tool.name).join("、");
					return t("cost.step", { step: String(step.step), cost: formatCost(step.cost) }) + (tools === "" ? "" : " · " + tools);
				});
				const extraSteps = allSteps.length - shownSteps.length;
				const parts = [
					t("cost.title") + " " + formatCost(found.cost),
					t(enlarged ? "cost.shrinkHint" : "cost.enlargeHint"),
					tokenLine("cost.uncachedInput", found.usage.uncachedInputTokens),
					tokenLine("cost.cacheRead", found.usage.cacheReadTokens),
					tokenLine("cost.cacheWrite", found.usage.cacheWriteTokens),
					tokenLine("cost.output", found.usage.outputTokens),
					tokenLine("cost.reasoning", found.usage.reasoningTokens),
					t("cost.model") + " " + (found.model === void 0 ? t("cost.noData") : found.model) + "（" + (found.mixedPeak ? t("cost.mixedPeak") : found.peak ? t("cost.peak") : t("cost.offPeak")) + "）",
					t("cost.split", { input: formatCost(found.inputCost), output: formatCost(found.outputCost) }),
					t("cost.unit") + " " + found.price.cacheHit + " / " + found.price.cacheMiss + " / " + found.price.output,
					found.hitRate === void 0 ? void 0 : t("cost.hitRate") + " " + Math.round(found.hitRate * 100) + "%",
					ratio === void 0
						? t("cost.compare") + " " + (index.count > 1 ? formatCost(index.median) : t("cost.noData"))
						: t("cost.compare") + " " + formatCost(index.median) + "，" + t("cost.ratio", { ratio: ratio >= 10 ? String(Math.round(ratio)) : ratio.toFixed(1) }),
					dearest ? t("cost.dearest") : void 0,
					stepLines.length === 0 ? void 0 : t("cost.breakdown"),
					...stepLines,
					extraSteps > 0 ? t("cost.moreSteps", { count: String(extraSteps) }) : void 0,
					lowCache ? t("cost.lowCache", { premium: formatCost(found.premium) }) : void 0,
					tier === 2 ? t("cost.veryExpensive") : tier === 1 ? t("cost.expensive") : void 0
				].filter((line) => line !== void 0);
				return React.createElement("span", {
					title: parts.join("\n"),
					role: "button",
					tabIndex: 0,
					onClick: () => setEnlarged(!enlarged),
					onKeyDown: (event) => {
						if (event.key !== "Enter" && event.key !== " ") return;
						event.preventDefault();
						setEnlarged(!enlarged);
					},
					"data-turn-cost": tier === 0 ? "normal" : tier === 1 ? "warn" : "alert",
					"data-turn-cost-cache": lowCache ? "low" : void 0,
					"data-turn-cost-enlarged": enlarged ? "" : void 0,
					"aria-label": t("cost.label") + formatCost(found.cost)
						+ (tier === 0 ? "" : "，" + (tier === 2 ? t("cost.veryExpensive") : t("cost.expensive")))
						+ (lowCache ? "，" + t("cost.lowCache", { premium: formatCost(found.premium) }) : ""),
					style: {
						display: "inline-flex",
						alignItems: "center",
						whiteSpace: "nowrap",
						fontVariantNumeric: "tabular-nums",
						// 点一下放大，再点还原；偏好记在本地。
						fontSize: enlarged ? ENLARGE_SCALE + "em" : "inherit",
						lineHeight: enlarged ? 1.2 : "inherit",
						cursor: "pointer",
						userSelect: "none",
						// 0 档沿用父级颜色；颜色之外还用字重再标一次，不单靠颜色传达信息。
						color: TIER_COLOR[tier],
						fontWeight: enlarged || tier === 2 ? 600 : void 0
					}
				}, formatCost(found.cost), lowCache ? React.createElement("span", {
					style: {
						marginLeft: 4,
						fontSize: "0.9em",
						color: "var(--dsw-alias-state-warn-primary, #d97706)"
					}
				}, "↓" + Math.round(found.hitRate * 100) + "%") : null);
			}
			return TurnCostPill;
		}
		/**
		* 造一个会话累计花费组件，挂在输入框下方的统计条里。
		* @param ctx - 客户端插件上下文。
		* @returns 注册到 conversation.composer.dock 的 React 组件。
		*/
		/**
		* 造一个会话累计花费组件，挂在输入框下方的统计条里。
		* @param ctx - 客户端插件上下文。
		* @returns 注册到 conversation.composer.dock 的 React 组件。
		*/
		function createTurnCostSummary(ctx) {
			/**
			* 输入框下方那一行：本次会话 / 今日（含预算）/ 近 7 天 / 缓存命中率 /
			* 上下文大小 / 下一轮预估 / 余额还够跑几轮。点一下切日预算档位。
			* @param props - 框架给的 `sessionId`、`useEvents`、`useProjection` 与 `t`。
			* @returns 汇总元素，还没有可计价的轮次时不渲染。
			*/
			function TurnCostSummary(props) {
				const t = props.t;
				const entries = props.useEvents((snapshot) => snapshot.entries);
				const index = React.useMemo(() => usageIndexFor(entries), [entries]);
				const pressure = props.useProjection("contextPressure");
				const [ledger, setLedger] = React.useState(null);
				const [budget, setBudget] = React.useState(readBudget);
				const [balance, setBalance] = React.useState(null);
				// 索引每次随事件重建；记账与预算告警都在这里做，去重由账本自己负责。
				React.useEffect(() => {
					const next = accountSession(props.sessionId, index);
					setLedger(next);
					const limit = readBudget();
					if (limit > 0 && recentTotal(next, 1) >= limit && !budgetAlertedToday(next)) {
						markBudgetAlerted(next);
						fireDanmaku(t("cost.danmakuBudget"), DANMAKU_MIN * 2, true);
					}
				}, [props.sessionId, index]);
				// 余额：用来算「还够跑几轮」。读不到就不显示这一段。
				React.useEffect(() => {
					let cancelled = false;
					const read = async () => {
						try {
							const result = await ctx.remote.account.getBalance(clientMetadata(ctx));
							if (cancelled) return;
							const value = result !== null && result !== void 0 && result.ok === true ? result.value : void 0;
							if (value === null || value === void 0 || value.status !== "ready") {
								setBalance(void 0);
								return;
							}
							const wallets = Array.isArray(value.value) ? value.value : [];
							const cny = wallets.filter((wallet) => wallet.currency === "CNY");
							const picked = cny.length > 0 ? cny : wallets;
							setBalance(picked.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0));
						} catch (error) {
							if (!cancelled) setBalance(void 0);
						}
					};
					read();
					const timer = setInterval(read, 60000);
					const onFocus = () => read();
					window.addEventListener("focus", onFocus);
					return () => {
						cancelled = true;
						clearInterval(timer);
						window.removeEventListener("focus", onFocus);
					};
				}, []);
				if (index.count === 0) return null;
				let sessionCost = 0;
				let cheapest = Infinity;
				let dearest = 0;
				let readTokens = 0;
				let promptTokens = 0;
				for (const record of index.byMessage.values()) {
					sessionCost += record.cost;
					if (record.cost < cheapest) cheapest = record.cost;
					if (record.cost > dearest) dearest = record.cost;
					readTokens += record.usage.cacheReadTokens ?? 0;
					promptTokens += (record.usage.cacheReadTokens ?? 0) + record.usage.uncachedInputTokens + (record.usage.cacheWriteTokens ?? 0);
				}
				const hitRate = promptTokens > 0 ? readTokens / promptTokens : void 0;
				const projected = pressure === void 0 || pressure === null ? void 0 : pressure.projectedTokens ?? pressure.pressureTokens;
				const average = sessionCost / index.count;
				const remaining = typeof balance === "number" && average > 0 ? Math.floor(balance / average) : void 0;
				const todayTotal = ledger === null ? void 0 : recentTotal(ledger, 1);
				const overBudget = budget > 0 && todayTotal !== void 0 && todayTotal >= budget;
				const nearBudget = budget > 0 && todayTotal !== void 0 && !overBudget && todayTotal >= budget * 0.8;
				const pieces = [
					t("cost.session", { cost: formatCost(sessionCost), turns: String(index.count) }),
					todayTotal === void 0 ? void 0 : budget > 0
						? t("cost.budget", { used: formatCost(todayTotal), total: formatCost(budget) })
						: t("cost.today", { cost: formatCost(todayTotal) }),
					ledger === null ? void 0 : t("cost.week", { cost: formatCost(recentTotal(ledger, 7)) }),
					hitRate === void 0 ? void 0 : t("cost.hitRateShort", { rate: Math.round(hitRate * 100) + "%" }),
					projected === void 0 ? void 0 : t("cost.context", { tokens: formatTokensShort(projected) }),
					index.count > 0 ? t("cost.nextEstimate", { low: formatCost(cheapest), high: formatCost(dearest) }) : void 0,
					remaining === void 0 ? void 0 : t("cost.remaining", { turns: String(remaining) }),
					overBudget ? t("cost.budgetOver") : void 0
				].filter((piece) => piece !== void 0);
				return React.createElement("span", {
					title: t("cost.summaryTitle") + "\n" + (budget > 0 ? t("cost.budgetHint", { total: formatCost(budget) }) : t("cost.budgetUnset")),
					role: "button",
					tabIndex: 0,
					onClick: () => setBudget(cycleBudget()),
					onKeyDown: (event) => {
						if (event.key !== "Enter" && event.key !== " ") return;
						event.preventDefault();
						setBudget(cycleBudget());
					},
					"data-turn-cost-summary": overBudget ? "over" : nearBudget ? "near" : "ok",
					style: {
						display: "inline-flex",
						alignItems: "center",
						flexWrap: "wrap",
						justifyContent: "center",
						// 自己占满一行，靠 order 落到 DSH 统计胶囊下面那一行。
						// 容器本身不换行，换行规则由注入的样式表打开。
						flex: "0 0 100%",
						order: 1,
						rowGap: 2,
						minWidth: 0,
						fontVariantNumeric: "tabular-nums",
						// 以 DSH 统计行的字号为基准，比它小 SUMMARY_FONT_STEP 像素。
						fontSize: "calc(var(--dsh-content-font-size-secondary, 13px) - " + SUMMARY_FONT_STEP + "px)",
						lineHeight: "calc(" + (20 - SUMMARY_FONT_STEP) + "px + var(--dsh-content-font-delta-secondary, 0px))",
						cursor: "pointer",
						userSelect: "none",
						color: overBudget
							? "var(--dsw-alias-state-error-primary, #dc2626)"
							: nearBudget
								? "var(--dsw-alias-state-warn-primary, #d97706)"
								: "var(--dsw-alias-label-tertiary, #8a8a8e)"
					}
				}, pieces.join(" · "));
			}
			return TurnCostSummary;
		}
		//#endregion
		//#region 花费历史面板
		/*
		 * 一个全局面板：左侧栏图标 → 中间栏整页。
		 * 两侧必须用同一个 id——`main` 是 keyed 插槽用 `key`，`sidebar.panellist` 是 list
		 * 插槽用 `id`，且图标组件本身就是那个字形（侧边栏不提供兜底图标）。
		 * 面板根元素要自己撑满高度并自带滚动：布局不给内边距也不给滚动容器。
		 */
		/** 面板 id：两处注册必须一致，也不能占用 `plugins` / `schedules` / `conversation`。 */
		const PANEL_ID = "turn-cost-history";
		/**
		* 汇总行比 DSH 那行统计小多少像素。
		* 两行都以 `--dsh-content-font-size-secondary` 为基准，所以在设置里调「内容字号」
		* 时仍然一起缩放，只是这一行始终小一档。嫌不够小就调大这个数。
		*/
		const SUMMARY_FONT_STEP = 2;
		/**
		* 侧边栏图标：一个柱状图字形，尺寸由侧边栏给。
		* @returns React 组件。
		*/
		function createCostHistoryIcon() {
			/**
			* @param props - 侧边栏给的 `{ size, active }`。
			* @returns SVG 字形。
			*/
			function CostHistoryIcon(props) {
				const size = typeof props.size === "number" ? props.size : 16;
				const bars = [[3, 7], [6.5, 11], [10, 5], [13.5, 9]];
				return React.createElement("svg", {
					width: size,
					height: size,
					viewBox: "0 0 16 16",
					fill: "none",
					"aria-hidden": "true"
				},
					React.createElement("path", { d: "M2 14h12", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" }),
					bars.map(([x, height], index) => React.createElement("path", {
						key: index,
						d: "M" + x + " 14V" + (14 - height),
						stroke: "currentColor",
						strokeWidth: 1.8,
						strokeLinecap: "round"
					})));
			}
			return CostHistoryIcon;
		}
		/**
		* 花费历史整页。
		* @returns React 组件。
		*/
		function createCostHistoryPage() {
			/**
			* @param props - 根作用域标准件，只用得到 `t`。
			* @returns 页面元素。
			*/
			function CostHistoryPage(props) {
				const t = props.t;
				const [ledger, setLedger] = React.useState(loadLedger);
				const view = React.useMemo(() => historyOf(ledger), [ledger]);
				const todayCost = ledger.days[dayKeyBack(0)] ?? 0;
				const weekCost = React.useMemo(() => recentTotal(ledger, 7), [ledger]);
				const buttonStyle = {
					boxSizing: "border-box",
					height: 32,
					padding: "0 12px",
					border: "0.5px solid var(--dsw-alias-border-l3)",
					borderRadius: 8,
					background: "transparent",
					color: "var(--dsw-alias-label-primary)",
					font: "inherit",
					fontSize: 13,
					cursor: "pointer"
				};
				const cell = { padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" };
				const headCell = { ...cell, color: "var(--dsw-alias-label-tertiary)", fontWeight: 500 };
				/**
				* 造一张两列表格。
				* @param title - 小节标题。
				* @param rows - `{ key, cost, turns }`。
				* @param keyLabel - 首列表头。
				* @param renderKey - 首列显示值。
				* @returns 小节元素。
				*/
				const table = (title, rows, keyLabel, renderKey) => React.createElement("section", { style: { marginTop: 28 } },
					React.createElement("h2", {
						style: { fontSize: 13, fontWeight: 600, color: "var(--dsw-alias-label-secondary)", margin: "0 0 8px" }
					}, title),
					rows.length === 0
						? React.createElement("p", { style: { margin: 0, color: "var(--dsw-alias-label-tertiary)", fontSize: 13 } }, t("costHistory.empty"))
						: React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } },
							React.createElement("thead", null, React.createElement("tr", null,
								React.createElement("th", { style: { ...headCell, textAlign: "left" } }, keyLabel),
								React.createElement("th", { style: headCell }, t("costHistory.turns")),
								React.createElement("th", { style: headCell }, t("costHistory.amount")))),
							React.createElement("tbody", null, rows.map((row) => React.createElement("tr", {
								key: row.key,
								style: { borderTop: "1px solid var(--dsw-alias-border-l2)" }
							},
								React.createElement("td", { style: { ...cell, textAlign: "left" } }, renderKey(row.key)),
								React.createElement("td", { style: cell }, String(row.turns)),
								React.createElement("td", { style: cell }, formatCost(row.cost)))))));
				return React.createElement("section", {
					"aria-label": t("costHistory.title"),
					style: {
						height: "100%",
						minHeight: 0,
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						background: "var(--dsw-alias-bg-base)",
						color: "var(--dsw-alias-label-primary)",
						fontSize: 14,
						lineHeight: 1.6
					}
				}, React.createElement("div", {
					style: {
						flex: 1,
						minHeight: 0,
						overflow: "auto",
						width: "100%",
						maxWidth: 960,
						margin: "0 auto",
						padding: "28px clamp(24px, 4vw, 48px) 48px",
						boxSizing: "border-box"
					}
				},
					React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
						React.createElement("h1", { style: { fontSize: 18, fontWeight: 600, margin: 0 } }, t("costHistory.title")),
						React.createElement("span", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: 13 } }, t("costHistory.subtitle")),
						React.createElement("span", { style: { flex: 1 } }),
						React.createElement("button", {
							type: "button",
							style: buttonStyle,
							onClick: () => downloadText("dsh-turn-cost.csv", historyCsv(ledger))
						}, t("costHistory.export")),
						React.createElement("button", {
							type: "button",
							style: buttonStyle,
							onClick: () => setLedger(loadLedger())
						}, t("costHistory.refresh"))),
					React.createElement("p", { style: { marginTop: 12, marginBottom: 0, color: "var(--dsw-alias-label-secondary)" } },
						t("costHistory.summary", {
							today: formatCost(todayCost),
							week: formatCost(weekCost),
							total: formatCost(view.total)
						})),
					table(t("costHistory.byDay"), view.days, t("costHistory.day"), (key) => key),
					table(t("costHistory.bySession"), view.sessions.slice(0, 20), t("costHistory.session"), (key) => key === "?" ? "—" : key.slice(0, 8))));
			}
			return CostHistoryPage;
		}
		//#endregion
		//#region 插件体
		/** 需要的服务：插槽、语言、会话事件，以及账户命名空间（算「还够跑几轮」用）。 */
		const inject = ["slots", "locale", "sessions", "remote", "remote.account"];
		/** 会话作用域尚未建立时的空事件窗口。 */
		const EMPTY_WINDOW = { entries: [], hasMore: false, revision: 0, change: { kind: "replace", entries: [] } };
		/**
		* 造一个「懒取值」的事件窗口源：每次读都现查 binding，因此会话作用域晚于
		* 注册建立时也能自己接上；查不到就给空窗口，绝不让消息行渲染失败。
		* `sessions.binding(id)` 返回 `{ sessionId, session, eventSource, ctx }`。
		* @param ctx - 客户端插件上下文。
		* @param sessionId - 会话 id。
		* @returns `{ getSnapshot, subscribe }` 裸可观察源。
		*/
		function lazyEventSource(ctx, sessionId) {
			const sourceOf = () => {
				const binding = ctx.sessions.binding(sessionId);
				return binding === void 0 ? void 0 : binding.eventSource;
			};
			return {
				getSnapshot() {
					const source = sourceOf();
					return source === void 0 ? EMPTY_WINDOW : source.getSnapshot();
				},
				subscribe(listener) {
					const source = sourceOf();
					return source === void 0 ? () => {} : source.subscribe(listener);
				}
			};
		}
		/**
		* 注册词典，把花费标签挂到每条回答页脚的
		* `conversation.chat.assistant-actions` 列表里，并把「本次会话 / 今日 / 近 7 天」
		* 汇总挂到输入框下方的 `conversation.composer.dock` 统计条里。
		* @param ctx - 客户端插件上下文。
		*/
		function apply(ctx) {
			installStyles();
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "turn-cost: dictionaries");
			const hooks = (sessionId) => ({
				// hooks 里交出去的是「裸可观察源」，框架会把它绑成 useEvents 选择器钩子。
				hooks: { events: lazyEventSource(ctx, sessionId) }
			});
			ctx.slots.inject("conversation.chat.assistant-actions", () => ctx.slots.register({
				name: "conversation.chat.assistant-actions",
				id: "turn-cost",
				order: 20,
				locale: NS,
				inject: hooks
			}, createTurnCostPill(ctx)));
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "turn-cost-summary",
				order: 20,
				locale: NS,
				inject: hooks
			}, createTurnCostSummary(ctx)));
			// 全屏弹幕浮层：shell.overlay 是根作用域的顶层浮层，正好铺满屏。
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "turn-cost-danmaku",
				order: 90,
				locale: NS
			}, createDanmakuLayer()));
			// 花费历史：main 是 keyed 槽用 key，sidebar.panellist 是 list 槽用 id，两者必须相同。
			const bound = ctx.locale.bind(NS);
			ctx.slots.inject("main", () => ctx.slots.register({
				name: "main",
				key: PANEL_ID,
				locale: NS
			}, createCostHistoryPage()));
			ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
				name: "sidebar.panellist",
				id: PANEL_ID,
				order: 100,
				locale: NS,
				label: () => bound("costHistory.panel")
			}, createCostHistoryIcon()));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
