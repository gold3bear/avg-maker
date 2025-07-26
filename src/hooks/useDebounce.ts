/**
 * debounce 函数：返回一个防抖动后的函数
 * @param func 需要防抖的函数
 * @param wait 防抖延迟时间（毫秒）
 * @returns 带有 cancel 方法的防抖函数
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): F & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function(this: ThisParameterType<F>, ...args: Parameters<F>) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait) as unknown as ReturnType<typeof setTimeout>;
  } as F & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
