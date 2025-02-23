import { Tab, BrowserSettings, HistoryEntry, BookmarkEntry, DownloadItem } from '@/lib/types/browser'

export interface Member {
  id: string;
  name: string;
  image?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  role?: 'admin' | 'moderator' | 'member';
  customStatus?: string;
}

export interface Hypertabs {
  createTab: (url?: string) => Promise<Tab>;
  loadUrl: (tabId: string, url: string) => Promise<void>;
  getTab: (id: string) => Tab | undefined;
  getAllTabs: () => Tab[];
  getActiveTab: () => Tab | null;
  setActiveTab: (id: string) => void;
  closeTab: (id: string) => void;
  goBack: (tabId: string) => Promise<void>;
  goForward: (tabId: string) => Promise<void>;
  canGoBack: (tabId: string) => boolean;
  canGoForward: (tabId: string) => boolean;
}

declare module '@mui/material' {
  export * from '@mui/material/index'
}

declare module '@mui/icons-material' {
  export * from '@mui/icons-material/index'
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  export const Search: FC<IconProps>
  export const Edit: FC<IconProps>
  export const FileIcon: FC<IconProps>
  export const ShieldAlert: FC<IconProps>
  export const ShieldCheck: FC<IconProps>
  export const Trash: FC<IconProps>
  export const Plus: FC<IconProps>
  export const Send: FC<IconProps>
  export const Smile: FC<IconProps>
  export const Paperclip: FC<IconProps>
  export const AtSign: FC<IconProps>
  export const Gift: FC<IconProps>
  export const Sticker: FC<IconProps>
  export const Menu: FC<IconProps>
  export const Settings: FC<IconProps>
  export const User: FC<IconProps>
  export const Bell: FC<IconProps>
  export const Shield: FC<IconProps>
  export const Keyboard: FC<IconProps>
  export const Languages: FC<IconProps>
  export const Gamepad2: FC<IconProps>
  export const Activity: FC<IconProps>
  export const MessageSquare: FC<IconProps>
  export const Hash: FC<IconProps>
  export const ChevronDown: FC<IconProps>
  export const Circle: FC<IconProps>
  export const ArrowLeft: FC<IconProps>
  export const ArrowRight: FC<IconProps>
  export const RotateCw: FC<IconProps>
  export const X: FC<IconProps>
  export const Loader2: FC<IconProps>
  export const AlertCircle: FC<IconProps>
  export const ClockIcon: FC<IconProps>
  export const MessageSquareIcon: FC<IconProps>
  export const UsersIcon: FC<IconProps>
  export const ActivityIcon: FC<IconProps>
  export const SettingsIcon: FC<IconProps>
  export const GlobeIcon: FC<IconProps>
} 