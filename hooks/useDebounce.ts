import { useCallback } from 'react'

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
} 