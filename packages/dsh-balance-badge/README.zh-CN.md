# dsh-balance-badge

[English](README.md) | 中文

在 DeepSeek Harness 左侧栏底部（「设置」上方）常驻显示 DeepSeek 账户余额的客户端插件。

```
余额   ¥123.45
```

鼠标悬停可看到充值余额与赠金余额的明细，点击可立即刷新。

## 它显示什么

| 状态 | 显示 |
|---|---|
| 查询成功 | 充值余额；若还有赠金，明细里单独列出 |
| 未登录 | `未登录` |
| 查询失败 | `余额不可用` |
| 查询中 | `查询中…` |

金额沿用开放平台网页的格式：两位小数、千分位分组、正数截断到分，不足一分的正数显示为 `<0.01`。

刷新时机：挂载时读一次，之后每 60 秒一次，窗口重新获得焦点时一次，点击时一次。

## 数据来源

余额来自 DeepSeek **平台账号**（你登录 Harness 时授权的那个账号），不是 API Key。
插件在浏览器侧调用 Harness 已有的账户接口：

```js
ctx.remote.account.getBalance({ version, locale, timezoneOffsetSeconds })
// => { ok: true, value: null | { status: 'ready', value: [...], bonusWallets: [...] } | { status: 'failed' } }
```

因此它和「设置 → 账号与余额」显示的是同一份数据；未登录时两者都会提示登录。
如果这里显示「未登录」，请先到「设置 → 账号与余额」登录一次。

## 界面位置

挂在侧边栏声明的 `sidebar.footer.action` 列表插槽上（`ui-sidebar` 声明，类型 `list`、作用域 `root`），
这是 DSH 为「设置旁边的可选操作」预留的席位。

注意：Windows 桌面版的侧边栏**收起**为图标栏时，DSH 会把整个底部区域隐藏
（`[data-windows-titlebar] .collapsed .footArea { display: none }`），
此时包括「设置」入口在内的底部内容都不显示，本徽章同理。展开侧边栏即可看到。

## 文件

| 文件 | 作用 |
|---|---|
| `package.json` | 声明 `dsh.bundle`（补丁层）与 `dsh.client`（浏览器半边） |
| `cordis.patch.yml` | 给 Host 的 Loader 插入一行 `balance-badge` |
| `lib/index.js` | Host 半边：空实现，只为让浏览器模块系统扫描到本包 |
| `lib/client.js` | 浏览器半边：`window.__ModuleLoader__.load({ id, factory })` 包裹的界面本体 |
| `tests/client.test.mjs` | 桩 React 单元测试（19 项）：模块包裹、注册、四种状态渲染 |
| `../../docs/` | 调研 DSH 插件与插槽机制时整理的参考文档（在仓库根目录） |

跑测试（零依赖，Node 18+ 即可；也可以用 DSH 自带的 node）：

```bash
node tests/client.test.mjs
```

`lib/client.js` 是手工编写而非构建产物，所以没有 `lib/types/*.d.ts`，也没有 sourcemap。

## 安装 / 卸载

安装（本机已装好，此处留档；`<仓库路径>` 换成克隆到的绝对路径）：

```powershell
dsh plugin --profile desktop add "<仓库路径>\packages\dsh-balance-badge"
```

这会把本目录以 `link:` 方式加进 `~/.dsh/profiles/desktop`，
并把 `dsh-balance-badge` 追加到 `dsh.profile.bundles`。
因为用的是软链，**移动本目录会让插件失效**。

卸载：

```powershell
dsh plugin --profile desktop remove dsh-balance-badge
```

安装或卸载后需要让 Harness 重新组合配置：重启应用，或在应用内「插件」页面里把本插件开关一次。
（profile 文件被外部改动时，运行中的应用不一定自己重载——实测有时会，有时不会。）
