window.__ModuleLoader__.load({
	id: "dsh-balance-badge",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");
		//#region 词典
		/** 词典命名空间：注册进 ctx.locale 后由组件的 props.t 读取。 */
		const NS = "balance-badge";
		/** 简体中文词典（键集以它为准）。 */
		const zh = {
			"balance.label": "余额",
			"balance.loading": "查询中…",
			"balance.signedOut": "未登录",
			"balance.unavailable": "余额不可用",
			"balance.refresh": "点击刷新",
			"balance.recharge": "充值余额",
			"balance.bonus": "赠金余额",
			"balance.tip": "DeepSeek 账户余额，点击刷新"
		};
		/** 与中文键集完全一致的英文词典。 */
		const en = {
			"balance.label": "Balance",
			"balance.loading": "Checking…",
			"balance.signedOut": "Not signed in",
			"balance.unavailable": "Balance unavailable",
			"balance.refresh": "Click to refresh",
			"balance.recharge": "Topped-up balance",
			"balance.bonus": "Granted balance",
			"balance.tip": "DeepSeek account balance — click to refresh"
		};
		//#endregion
		//#region 常量与工具
		/** 自动刷新间隔（毫秒）。 */
		const REFRESH_MS = 60000;
		/** 账户接口要求的客户端版本；取不到真实版本时的兜底值。 */
		const FALLBACK_VERSION = "0.2.0-rc.2";
		/**
		* 读当前客户端版本。账户 RPC 会把它放进 x-client-version 头。
		* @returns 版本字符串。
		*/
		function clientVersion() {
			const desktop = globalThis.dshDesktop;
			const candidates = [desktop && desktop.clientVersion, desktop && desktop.version, globalThis.__DSH_CLIENT_VERSION__];
			for (const candidate of candidates) {
				if (typeof candidate === "string" && candidate !== "") return candidate;
			}
			return FALLBACK_VERSION;
		}
		/**
		* 组装一次账户调用的身份信息。
		* @param ctx - 客户端插件上下文，用于读取当前界面语言。
		* @returns 账户 RPC 需要的元数据。
		*/
		function clientMetadata(ctx) {
			let locale = "zh";
			try {
				const active = ctx.locale.getSnapshot().active;
				if (typeof active === "string" && active !== "") locale = active;
			} catch (error) {
				// 语言读取失败不阻断余额查询，退回中文。
			}
			return {
				version: clientVersion(),
				locale,
				timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60
			};
		}
		/**
		* 币种符号。
		* @param currency - 后端给出的币种代码。
		* @returns 金额前缀符号。
		*/
		function currencySymbol(currency) {
			return currency === "CNY" ? "¥" : "$";
		}
		/**
		* 按开放平台网页的规则格式化金额：两位小数、千分位分组、正数截断到分，
		* 不足一分的正数显示为 <0.01。
		* @param raw - 后端给出的十进制金额字符串。
		* @returns 可显示的金额文本。
		*/
		function formatAmount(raw) {
			const text = String(raw).trim();
			if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(text)) return text;
			const value = Number(text);
			if (!Number.isFinite(value)) return text;
			const negative = value < 0;
			const magnitude = Math.abs(value);
			if (magnitude > 0 && magnitude < 0.01) return "<0.01";
			const truncated = Math.floor(magnitude * 100 + 1e-9) / 100;
			const parts = truncated.toFixed(2).split(".");
			const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return (negative && truncated !== 0 ? "-" : "") + grouped + "." + parts[1];
		}
		/**
		* 把钱包数组拼成一行金额文本。
		* @param wallets - `{ currency, balance }` 数组。
		* @returns 以 " · " 分隔的金额文本，空数组为空串。
		*/
		function walletText(wallets) {
			return wallets
				.filter((wallet) => wallet && typeof wallet.balance === "string")
				.map((wallet) => currencySymbol(wallet.currency) + formatAmount(wallet.balance))
				.join(" · ");
		}
		//#endregion
		//#region 组件
		/**
		* 造一个绑定到本插件上下文的余额徽章组件。Hook 只在组件内部调用。
		* @param ctx - 客户端插件上下文。
		* @returns 注册到 sidebar.footer.action 的 React 组件。
		*/
		function createBalanceBadge(ctx) {
			/**
			* 读一次余额。
			* @returns 下一个界面状态；失败也走返回值，不抛出。
			*/
			const read = async () => {
				try {
					const result = await ctx.remote.account.getBalance(clientMetadata(ctx));
					if (!result || result.ok !== true) return { status: "unavailable" };
					const value = result.value;
					if (value === null || value === void 0) return { status: "signedOut" };
					if (value.status !== "ready") return { status: "unavailable" };
					return {
						status: "ready",
						wallets: Array.isArray(value.value) ? value.value : [],
						bonusWallets: Array.isArray(value.bonusWallets) ? value.bonusWallets : []
					};
				} catch (error) {
					return { status: "unavailable" };
				}
			};
			/**
			* 侧边栏底部常驻的余额徽章：挂载即读一次，之后每分钟、窗口重新获得焦点时
			* 各读一次，点击也立即重读。
			* @param props - 父级渲染位给出的 `wide`，以及框架按 locale 给的 `t`。
			* @returns 徽章元素。
			*/
			function BalanceBadge(props) {
				const t = props.t;
				const wide = props.wide !== false;
				const [state, setState] = React.useState({ status: "loading" });
				const mounted = React.useRef(true);
				const publish = React.useCallback(() => {
					read().then((next) => {
						if (mounted.current) setState(next);
					});
				}, []);
				React.useEffect(() => {
					mounted.current = true;
					publish();
					const timer = setInterval(publish, REFRESH_MS);
					const onFocus = () => publish();
					window.addEventListener("focus", onFocus);
					return () => {
						mounted.current = false;
						clearInterval(timer);
						window.removeEventListener("focus", onFocus);
					};
				}, [publish]);
				const ready = state.status === "ready";
				const recharge = ready ? walletText(state.wallets) : "";
				const bonus = ready ? walletText(state.bonusWallets) : "";
				const amount = recharge !== "" ? recharge : bonus;
				let text;
				if (state.status === "loading") text = t("balance.loading");
				else if (state.status === "signedOut") text = t("balance.signedOut");
				else if (state.status === "unavailable") text = t("balance.unavailable");
				else text = amount !== "" ? amount : t("balance.unavailable");
				const lines = [];
				if (ready) {
					lines.push(t("balance.recharge") + "：" + (recharge !== "" ? recharge : "—"));
					if (bonus !== "") lines.push(t("balance.bonus") + "：" + bonus);
				}
				lines.push(t("balance.refresh"));
				const title = (ready ? "" : t("balance.tip") + "\n") + lines.join("\n");
				return React.createElement("button", {
					type: "button",
					title,
					"aria-label": t("balance.label") + " " + text,
					onClick: publish,
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: wide ? "space-between" : "center",
						gap: 6,
						boxSizing: "border-box",
						width: wide ? "100%" : "auto",
						minWidth: 0,
						margin: 0,
						padding: wide ? "7px 10px" : "7px 4px",
						border: "none",
						borderRadius: 8,
						background: "transparent",
						color: "var(--dsw-alias-label-tertiary, #8a8a8e)",
						font: "inherit",
						fontSize: wide ? 12 : 11,
						lineHeight: "16px",
						textAlign: "left",
						cursor: "pointer",
						overflow: "hidden",
						whiteSpace: "nowrap",
						WebkitAppRegion: "no-drag"
					}
				}, wide && React.createElement("span", { style: { flex: "none" } }, t("balance.label")), React.createElement("span", {
					style: {
						minWidth: 0,
						overflow: "hidden",
						textOverflow: "ellipsis",
						fontVariantNumeric: "tabular-nums",
						color: ready ? "var(--dsw-alias-label-primary, #1a1a1a)" : void 0
					}
				}, text));
			}
			return BalanceBadge;
		}
		//#endregion
		//#region 插件体
		/** 需要的服务：插槽注册表、语言、RPC，以及账户命名空间。 */
		const inject = ["slots", "locale", "remote", "remote.account"];
		/**
		* 注册词典，并把余额徽章挂到侧边栏底部的 `sidebar.footer.action` 列表里。
		* 用 slots.inject 而不是直接 register：侧边栏可能比本插件后挂载，等它声明出
		* 这个插槽再注册。
		* @param ctx - 客户端插件上下文。
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "balance-badge: dictionaries");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "balance-badge",
				order: 10,
				locale: NS
			}, createBalanceBadge(ctx)));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
