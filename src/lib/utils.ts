/**
 * 通用工具函数
 *
 * 这个文件存放整个项目都会用到的小工具函数。
 * 随着开发推进，会往这里添加更多函数。
 */

/**
 * cn — 合并 CSS 类名（className）
 *
 * 为什么要这个函数？
 * 在 React 中，你经常需要根据条件拼接不同的 CSS 类名。
 * 比如：按钮平时是灰色，禁用时是浅灰，加载中是蓝色。
 * cn("btn", isDisabled && "btn-disabled", isLoading && "btn-loading")
 * 会输出 "btn btn-disabled" 或 "btn btn-loading"（自动跳过 false/undefined）
 *
 * 后续会升级为使用 clsx + tailwind-merge 库，现在先用简单版。
 */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
