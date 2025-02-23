import { useEffect, useRef } from 'react'
import { measurePerformance } from '@/lib/performance'

export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0)
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current += 1
      
      const endMeasure = measurePerformance(
        `${componentName}-render-${renderCount.current}`
      )
      
      console.log(`${componentName} rendered ${renderCount.current} times`)
      
      return endMeasure
    }
  })
}

export function useDataFetchingPerformance<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const endMeasure = measurePerformance('data-fetching')
      
      queryFn().finally(endMeasure)
    }
  }, dependencies)
} 