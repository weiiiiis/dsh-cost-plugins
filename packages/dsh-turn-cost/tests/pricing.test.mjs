/**
 * 价格模型与金额格式的独立验证（写定后原样内联进 lib/client.js）。
 * 价格来源：https://api-docs.deepseek.com/zh-cn/quick_start/pricing/
 */

/** 元 / 百万 token。cacheMiss 同时承担「缓存未命中输入」与「缓存写入」。 */
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

/** 兜底单价：认不出模型时按 deepseek-flash 的高峰价，宁可略高估也不低估。 */
const FALLBACK_PRICE = PRICING["deepseek-flash"].peak;

/**
 * 判断某个时刻是否处于高峰时段。
 * 规则：北京时间周一至周五（不含中国法定节假日）9:00-12:00、14:00-18:00 为高峰，
 * 其余（含周末与法定节假日全天）为空闲。节假日无法离线判断，故只按星期与小时算，
 * 会影响到的只是法定节假日里的那几段时间（会把空闲价算成高峰价，偏保守）。
 * @param timeMs - 该轮请求的毫秒时间戳。
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
 * @returns `{ cacheHit, cacheMiss, output }`，单位元/百万 token。
 */
function priceOf(model, peak) {
	const entry = PRICING[model];
	if (entry === undefined) return FALLBACK_PRICE;
	return peak ? entry.peak : entry.offPeak;
}

/**
 * 由四档 token 数算钱。
 * @param buckets - `{ uncachedInputTokens, cacheReadTokens, cacheWriteTokens, outputTokens }`。
 * @param model - 模型 id。
 * @param timeMs - 该轮请求的毫秒时间戳。
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
 * 金额格式：至少两位小数，最多四位，去掉末尾多余的零。
 * @param value - 元。
 * @returns 形如 `¥0.0032` 的文本。
 */
function formatCost(value) {
	if (!Number.isFinite(value) || value <= 0) return "¥0";
	if (value >= 1) return "¥" + value.toFixed(2);
	if (value < 0.0001) return "<¥0.0001";
	let text = value.toFixed(4);
	text = text.replace(/(\.\d\d)0+$/, "$1");
	return "¥" + text;
}

// ---------------- 自检 ----------------
let failures = 0;
function check(label, actual, expected) {
	const ok = actual === expected;
	console.log((ok ? "PASS  " : "FAIL  ") + label + "  :: " + actual + (ok ? "" : "  expected " + expected));
	if (!ok) failures++;
}

// 高峰：2026-10-06 是周二。北京时间 10:00 = UTC 02:00。
const tuePeak = Date.UTC(2026, 9, 6, 2, 0, 0);
const tueOff = Date.UTC(2026, 9, 6, 6, 0, 0); // 北京 14:00 -> 仍是高峰
const tueNight = Date.UTC(2026, 9, 5, 20, 0, 0); // 北京 10-06 04:00 -> 空闲
const sat = Date.UTC(2026, 9, 10, 2, 0, 0); // 周六
check("周二北京10点算高峰", isPeakHour(tuePeak), true);
check("周二北京14点算高峰", isPeakHour(tueOff), true);
check("周二北京凌晨4点算空闲", isPeakHour(tueNight), false);
check("周六白天算空闲", isPeakHour(sat), false);

const oneMillion = { uncachedInputTokens: 0, cacheReadTokens: 1e6, cacheWriteTokens: 0, outputTokens: 0 };
check("100万缓存命中 token 高峰 = ¥0.04", formatCost(costOf(oneMillion, "deepseek-flash", tuePeak).cost), "¥0.04");
check("100万缓存命中 token 空闲 = ¥0.02", formatCost(costOf(oneMillion, "deepseek-flash", tueNight).cost), "¥0.02");

const miss = { uncachedInputTokens: 1e6, cacheWriteTokens: 0, cacheReadTokens: 0, outputTokens: 0 };
check("100万未命中 token 空闲 = ¥1.00", formatCost(costOf(miss, "deepseek-flash", tueNight).cost), "¥1.00");

const out = { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1e6 };
check("100万输出 token 空闲 = ¥4.00", formatCost(costOf(out, "deepseek-flash", tueNight).cost), "¥4.00");

const write = { uncachedInputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 1e6, outputTokens: 0 };
check("缓存写入按未命中价 = ¥1.00", formatCost(costOf(write, "deepseek-flash", tueNight).cost), "¥1.00");

const realistic = { uncachedInputTokens: 1200, cacheReadTokens: 48000, cacheWriteTokens: 800, outputTokens: 900 };
check("典型一轮（空闲）= ¥0.0066", formatCost(costOf(realistic, "deepseek-flash", tueNight).cost), "¥0.0066");

check("未知模型走兜底价", formatCost(costOf(miss, "some-other-model", tuePeak).cost), "¥2.00");
check("零用量显示 ¥0", formatCost(0), "¥0");
check("极小金额显示下界", formatCost(0.00002), "<¥0.0001");
check("一元以上保留两位", formatCost(1.2345), "¥1.23");
check("v4-pro 空闲输出 100万 = ¥13.50", formatCost(costOf(out, "deepseek-v4-pro", tueNight).cost), "¥13.50");

console.log(failures === 0 ? "\nALL PRICING CHECKS PASSED" : "\n" + failures + " FAILED");
process.exit(failures === 0 ? 0 : 1);
