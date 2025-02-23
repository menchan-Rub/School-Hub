interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  resourceCount: number;
  resourceSize: number;
  memoryUsage?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  measurePageLoad(): PerformanceMetrics {
    const timing = performance.timing;
    const memory = (performance as any).memory;

    const metrics: PerformanceMetrics = {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      renderTime: timing.domComplete - timing.domLoading,
      resourceCount: performance.getEntriesByType('resource').length,
      resourceSize: this.calculateResourceSize(),
    };

    if (memory) {
      metrics.memoryUsage = {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }

    this.addMetrics(metrics);
    return metrics;
  }

  private calculateResourceSize(): number {
    return performance.getEntriesByType('resource')
      .reduce((total, resource) => total + (resource as any).encodedBodySize || 0, 0);
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      throw new Error('No metrics available');
    }

    const sum = this.metrics.reduce((acc, metrics) => ({
      loadTime: acc.loadTime + metrics.loadTime,
      renderTime: acc.renderTime + metrics.renderTime,
      resourceCount: acc.resourceCount + metrics.resourceCount,
      resourceSize: acc.resourceSize + metrics.resourceSize,
    }));

    const count = this.metrics.length;
    return {
      loadTime: sum.loadTime / count,
      renderTime: sum.renderTime / count,
      resourceCount: Math.round(sum.resourceCount / count),
      resourceSize: Math.round(sum.resourceSize / count),
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor(); 