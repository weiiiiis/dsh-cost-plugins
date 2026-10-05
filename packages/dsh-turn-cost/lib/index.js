/**
 * 每条回答花费插件的 host 半边。
 *
 * 本包只贡献浏览器侧的界面；host 侧必须存在一行，浏览器的模块系统才会扫描到
 * 本包的 `dsh.client` 声明并下发 `lib/client.js`。因此 apply() 是空实现。
 *
 * @module dsh-turn-cost
 */

/** Host 插件体：本包不注册任何 host 侧服务。 */
export function apply() {}
