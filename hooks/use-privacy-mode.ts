import { useState, useEffect } from 'react'
import { Storage } from '@/lib/storage'

export function usePrivacyMode() {
  const [isPrivate, setIsPrivate] = useState(false)
  const storage = new Storage()

  useEffect(() => {
    storage.getSettings().then(settings => {
      setIsPrivate(settings.privateMode)
    })
  }, [])

  const togglePrivacyMode = async () => {
    const newValue = !isPrivate
    setIsPrivate(newValue)
    const settings = await storage.getSettings()
    await storage.saveSettings({
      ...settings,
      privateMode: newValue
    })
  }

  return {
    isPrivate,
    togglePrivacyMode
  }
} 