import { signal } from '@preact/signals';

type View = 'browser' | 'bookmarks' | 'history' | 'settings' | 'downloads';

const activeView = signal<View>('browser');

export const useNavigationStore = () => {
  const setActiveView = (view: View) => {
    activeView.value = view;
  };

  return {
    activeView: activeView.value,
    setActiveView
  };
}; 