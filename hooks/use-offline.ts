import { useState, useEffect } from 'react'

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  )

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
      setLastOnlineAt(new Date())
    }

    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOffline,
    lastOnlineAt,
    hasBeenOnline: lastOnlineAt !== null
  }
}