import { create } from 'zustand'

export type NavigationView = 
  | 'dashboard'
  | 'admin-overview'
  | 'admin-users'
  | 'admin-servers'
  | 'admin-messages'
  | 'admin-announcements'
  | 'admin-security'
  | 'admin-audit-logs'
  | 'admin-bans'
  | 'admin-settings'
  | 'friends'
  | 'chat'
  | 'notifications'
  | 'browser'
  | 'bookmarks'
  | 'settings'

interface NavigationStore {
  activeView: NavigationView
  setActiveView: (view: NavigationView) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
})) 