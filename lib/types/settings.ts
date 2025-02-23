export interface UserSettings {
  id: string
  userId: string
  theme: 'light' | 'dark' | 'system'
  notifications: {
    messages: boolean
    friendRequests: boolean
    updates: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowFriendRequests: boolean
    showLastSeen: boolean
  }
  language: string
  timezone: string
} 