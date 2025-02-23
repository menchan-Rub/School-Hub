export function measurePerformance(label: string) {
  if (process.env.NODE_ENV === "development") {
    performance.mark(`${label}-start`)
    
    return () => {
      performance.mark(`${label}-end`)
      performance.measure(
        label,
        `${label}-start`,
        `${label}-end`
      )
      
      const measurements = performance.getEntriesByName(label)
      const lastMeasurement = measurements[measurements.length - 1]
      
      console.log(`${label}: ${lastMeasurement.duration.toFixed(2)}ms`)
    }
  }
  
  return () => {}
}

export function usePerformanceMonitor(componentName: string) {
  if (process.env.NODE_ENV === "development") {
    const endMeasure = measurePerformance(`${componentName}-render`)
    return endMeasure
  }
} 