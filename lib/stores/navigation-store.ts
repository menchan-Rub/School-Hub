import { create } from 'zustand'

interface NavigationStore {
  activeView: string
  setActiveView: (view: string) => void
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
})) 