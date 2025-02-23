import { create } from 'zustand'

type View = 'browser' | 'dashboard' | 'chat' | 'settings'

interface TabState {
  activeView: View
  setActiveView: (view: View) => void
}

export const useTabStore = create<TabState>((set) => ({
  activeView: 'browser',
  setActiveView: (view) => set({ activeView: view }),
})) 