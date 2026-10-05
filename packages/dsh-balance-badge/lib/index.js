/**
 * 余额徽章插件的 host 半边。
 *
 * 本包只贡献浏览器侧的界面，但一个客户端插件仍然必须在 Host 的 Loader 里有一行，
 * 浏览器的模块系统才会扫描到这个包的 `dsh.client` 声明并把 `lib/client.js` 发下去。
 * 因此这里的 apply() 是空实现。
 *
 * @module dsh-balance-badge
 */

/** Host 插件体：本包不注册任何 host 侧服务。 */
export function apply() {}
