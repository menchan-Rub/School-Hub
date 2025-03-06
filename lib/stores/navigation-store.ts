import { create } from 'zustand'

type View = 
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

interface NavigationStore {
  activeView: View
  setActiveView: (view: View) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
})) 