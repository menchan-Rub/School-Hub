import {
  Loader2,
  MessageSquare,
  User,
  Server,
  Settings,
  Users,
  PlusCircle,
  Menu,
  LogOut,
  Trash,
  UserPlus,
  Settings2,
  Github,
} from "lucide-react"

export const Icons = {
  spinner: Loader2,
  message: MessageSquare,
  user: User,
  server: Server,
  settings: Settings,
  users: Users,
  add: PlusCircle,
  menu: Menu,
  logout: LogOut,
  trash: Trash,
  userPlus: UserPlus,
  settings2: Settings2,
  gitHub: Github,
}

export type Icon = keyof typeof Icons

