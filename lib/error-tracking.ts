type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

interface ErrorDetails {
  message: string
  stack?: string
  timestamp: number
  severity: ErrorSeverity
  userId?: string
  context?: Record<string, any>
}

class ErrorTracker {
  private errors: ErrorDetails[] = []
  private readonly maxErrors = 100

  track(
    error: Error,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ) {
    const errorDetails: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      severity,
      context
    }

    this.errors.unshift(errorDetails)
    
    if (this.errors.length > this.maxErrors) {
      this.errors.pop()
    }

    if (severity === 'critical') {
      this.notifyTeam(errorDetails)
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('Tracked Error:', errorDetails)
    }
  }

  private async notifyTeam(error: ErrorDetails) {
    try {
      await fetch('/api/error-notification', {
        method: 'POST',
        body: JSON.stringify(error)
      })
    } catch (e) {
      console.error('Failed to notify team:', e)
    }
  }

  getRecent(count: number = 10) {
    return this.errors.slice(0, count)
  }

  clear() {
    this.errors = []
  }
}

export const errorTracker = new ErrorTracker() 