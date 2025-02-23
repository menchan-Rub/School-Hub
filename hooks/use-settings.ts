import { useState, useEffect } from 'react'
import { UserSettings } from '@/lib/types/settings'
import { toast } from 'sonner'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error('設定の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error()
      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      toast.success('設定を更新しました')
    } catch {
      toast.error('設定の更新に失敗しました')
    }
  }

  return {
    settings,
    isLoading,
    updateSettings
  }
} 