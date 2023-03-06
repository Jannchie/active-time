
export function throttle<T extends (...args: any[]) => void> (
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timerId: NodeJS.Timeout | null

  return function (...args: Parameters<T>): void {
    if (!timerId) {
      timerId = setTimeout(() => {
        func(...args)
        timerId = null
      }, delay)
    }
  }
}

export function throttleAsync<T extends (...args: any[]) => Promise<void>> (
  func: T,
  delay: number,
): (...args: Parameters<T>) => Promise<void> {
  let timerId: NodeJS.Timeout | null

  return async function (...args: Parameters<T>): Promise<void> {
    if (!timerId) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      timerId = setTimeout(async () => {
        await func(...args)
        timerId = null
      }, delay)
    }
  }
}
