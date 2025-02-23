import { create } from 'zustand'

interface NavigationState {
  currentView: 'dashboard' | 'browser' | 'settings' | 'chat' | 'friends'
  setCurrentView: (view: NavigationState['currentView']) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view })
})) 