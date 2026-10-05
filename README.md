# DSH 花费插件

两个给 [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/) 桌面版用的**客户端插件**，
一个看余额，一个看每一轮花了多少钱。

| 插件 | 做什么 |
|---|---|
| [`dsh-balance-badge`](packages/dsh-balance-badge) | 侧边栏底部常驻显示 DeepSeek 账户余额（充值 / 赠金），点一下刷新 |
| [`dsh-turn-cost`](packages/dsh-turn-cost) | 每条回答花了多少钱：页脚金额与分级配色、缓存命中提示、分步拆解、会话/今日汇总、日预算、好贵弹幕、花费历史面板 |

两个插件互相独立，可以只装一个。

## 长什么样

`dsh-turn-cost` 在每条回答的页脚加一枚金额标签，紧挨着 DSH 自带的「本轮用量」：

```
… 回答正文 …

        花费 ¥1.02   [ 本轮用量 51.9K tok ]   14:32
```

悬停展开明细：四档 token、输入/输出各自的金额、实际模型与单价档位、本会话中位数与倍数、
缓存命中率、以及**按花费排序的分步拆解**（`第 2 步 ¥0.0520 · read`）。

输入框下方单独一行汇总（字号比 DSH 那行统计小一档）：

```
本次会话 ¥3.40（6 轮） · 今日 ¥3.40 · 近 7 天 ¥12.40 · 缓存命中 99.7%
  · 上下文 243.0k · 下一轮预计 ¥0.14~1.02 · 还能跑约 35 轮
```

单轮花到 ¥1 以上，屏幕上会飞过一整屏弹幕；左侧栏还多一个柱状图图标，点开是花费历史（可按天 /
按会话查看，导出 CSV）。

细节见各插件自己的 README。

## 环境要求

- DeepSeek Harness 桌面版（在 `0.2.0-rc.2` 上开发与验证）
- 想用余额与「还能跑约 N 轮」，需要先在 DSH 里登录 DeepSeek 账号
  （设置 → 账号与余额；余额走的是平台账号，不是 API Key）

## 安装

插件以 `link:` 方式装进 DSH 的 profile，所以**先克隆到一个不会再移动的位置**：

```powershell
git clone https://github.com/<你的用户名>/dsh-cost-plugins.git "$env:USERPROFILE\dsh-cost-plugins"
```

然后逐个装（`<仓库路径>` 换成上面克隆到的绝对路径）：

```powershell
dsh plugin --profile desktop add "<仓库路径>\packages\dsh-turn-cost"
dsh plugin --profile desktop add "<仓库路径>\packages\dsh-balance-badge"
```

装完让 DSH 重新组合一次配置：重启应用，或在应用内「插件」页面里把新插件开关一次。
运行中的应用一般几秒内就会自己重新组合。

卸载：

```powershell
dsh plugin --profile desktop remove dsh-turn-cost
dsh plugin --profile desktop remove dsh-balance-badge
```

> `desktop` 这个 profile 由桌面应用独占管理，**必须用桌面版装的 `dsh` 命令**；
> 从 npm 装的 CLI 会拒绝操作它。另外因为它用的是软链，装完之后**不要移动仓库目录**。

## 仓库结构

```
packages/
  dsh-balance-badge/     余额徽章
    package.json         声明 dsh.bundle（补丁层）与 dsh.client（浏览器半边）
    cordis.patch.yml     给 Host 的 Loader 插入一行
    lib/index.js         Host 半边：空实现，只为让浏览器模块系统扫描到本包
    lib/client.js        浏览器半边：界面本体（手写，非构建产物）
    tests/               桩 React 的单元测试
  dsh-turn-cost/         每条回答花费
    （同样的结构，tests/ 里多一份价格模型测试）
docs/                    开发时整理的 DSH 插件与插槽机制参考文档
```

## 跑测试

不需要装任何依赖，用 Node 直接跑（Node 18+ 即可）：

```bash
node packages/dsh-turn-cost/tests/pricing.test.mjs
node packages/dsh-turn-cost/tests/client.test.mjs
node packages/dsh-balance-badge/tests/client.test.mjs
```

三个文件分别覆盖价格换算、`dsh-turn-cost` 的完整客户端逻辑（126 项）、
`dsh-balance-badge` 的渲染（19 项）。

## 原理（简述）

DSH 的插件就是一个普通的 npm 包，只要：

1. `package.json` 里用 `dsh.bundle.patch` 声明一个补丁层，`dsh.client.platform: "web"` 声明有浏览器半边；
2. 补丁层往 Host 的 Loader 里插一行；
3. 浏览器半边导出 `apply(ctx)` / `inject`。

界面通过 **插槽** 挂进 DSH 已有的位置，这两个插件用到的是：

| 插槽 | 用途 |
|---|---|
| `sidebar.footer.action` | 侧边栏底部（余额徽章） |
| `conversation.chat.assistant-actions` | 每条回答的页脚（花费标签） |
| `conversation.composer.dock` | 输入框下方的统计条（汇总） |
| `shell.overlay` | 全屏顶层浮层（弹幕） |
| `main` + `sidebar.panellist` | 全局面板（花费历史页） |

数据全部来自客户端已有的东西，插件不额外发请求（读余额那一处除外）：
花费由该轮会话事件里模型自己上报的 `usage` 折叠而来；余额走 DSH 的
`ctx.remote.account.getBalance()`。

## 已知限制

- **金额是按 token 单价估算的，不是账单。** 平台按自己的计量扣费，高峰/空闲与法定节假日的
  判定、以及价格调整，都可能让这里的数字与真实扣费有出入。单价写在各插件的 `lib/client.js` 顶部，
  价格变了改常量即可。
- 中国法定节假日无法离线判断，插件只按星期与小时判高峰，节假日里那几个小时会按高峰价显示
  （偏保守，不会少算）。
- 只看得到**已结算**的轮次：一轮还在跑时没有金额，结束后才出现。
- 会话事件窗口之外的旧消息没有金额。
- 「推理 token」这一档在当前适配器下拿不到（实测几百条消息里一次都没上报），所以明细里通常没有那一行。
- DSH 升级后插槽或事件结构可能变化。这些插件是照着 `0.2.0-rc.2` 写的，仅供参考。

## 许可

[MIT](LICENSE)
