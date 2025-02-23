import { 
  Server, 
  ServerMember, 
  ServerChannel, 
  ServerPermission, 
  ChannelPermission,
  ServerRole,
  ServerRolePermissions,
  ChannelPermissionOverwrite,
  ServerData,
  ServerMemberData,
  ServerRoleData
} from './types/server'

// デフォルトの権限マップ
const DEFAULT_ROLE_PERMISSIONS: Record<ServerRole, ServerPermission[]> = {
  'OWNER': [
    'MANAGE_SERVER',
    'MANAGE_ROLES',
    'MANAGE_CHANNELS',
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'CREATE_INVITE',
    'CHANGE_NICKNAME',
    'MANAGE_NICKNAMES',
    'MANAGE_WEBHOOKS',
    'VIEW_AUDIT_LOG',
    'VIEW_SERVER_INSIGHTS'
  ],
  'ADMIN': [
    'MANAGE_CHANNELS',
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'CREATE_INVITE',
    'CHANGE_NICKNAME',
    'MANAGE_NICKNAMES',
    'MANAGE_WEBHOOKS',
    'VIEW_AUDIT_LOG',
    'VIEW_SERVER_INSIGHTS'
  ],
  'MODERATOR': [
    'KICK_MEMBERS',
    'CREATE_INVITE',
    'CHANGE_NICKNAME',
    'VIEW_AUDIT_LOG'
  ],
  'MEMBER': [
    'CHANGE_NICKNAME',
    'CREATE_INVITE'
  ]
}

const DEFAULT_CHANNEL_PERMISSIONS: Record<ServerRole, ChannelPermission[]> = {
  'OWNER': [
    'VIEW_CHANNEL',
    'MANAGE_CHANNEL',
    'MANAGE_MESSAGES',
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'ADD_REACTIONS',
    'USE_EXTERNAL_EMOJIS',
    'MENTION_EVERYONE',
    'MANAGE_THREADS',
    'CREATE_THREADS',
    'SEND_MESSAGES_IN_THREADS'
  ],
  'ADMIN': [
    'VIEW_CHANNEL',
    'MANAGE_CHANNEL',
    'MANAGE_MESSAGES',
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'ADD_REACTIONS',
    'USE_EXTERNAL_EMOJIS',
    'MENTION_EVERYONE',
    'MANAGE_THREADS',
    'CREATE_THREADS',
    'SEND_MESSAGES_IN_THREADS'
  ],
  'MODERATOR': [
    'VIEW_CHANNEL',
    'MANAGE_MESSAGES',
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'ADD_REACTIONS',
    'USE_EXTERNAL_EMOJIS',
    'CREATE_THREADS',
    'SEND_MESSAGES_IN_THREADS'
  ],
  'MEMBER': [
    'VIEW_CHANNEL',
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'ADD_REACTIONS',
    'USE_EXTERNAL_EMOJIS',
    'CREATE_THREADS',
    'SEND_MESSAGES_IN_THREADS'
  ]
}

export class PermissionManager {
  private server: ServerData
  private member: ServerMemberData
  private roles: ServerRoleData[]
  private isSuperAdmin: boolean

  constructor(server: ServerData, member: ServerMemberData, userRole?: string) {
    this.server = server
    this.member = member
    this.roles = this.getMemberRoles()
    this.isSuperAdmin = userRole === 'super_admin'
  }

  private getMemberRoles(): ServerRoleData[] {
    return this.server.roles.filter(role => 
      this.member.roles.includes(role.id)
    ).sort((a, b) => b.position - a.position)
  }

  hasServerPermission(permission: ServerPermission): boolean {
    // スーパー管理者は全ての権限を持つ
    if (this.isSuperAdmin) {
      return true
    }

    // サーバーオーナーは全ての権限を持つ
    if (this.server.ownerId === this.member.userId) {
      return true
    }

    // 役職の権限をチェック
    return this.roles.some(role => 
      role.permissions.includes(permission)
    )
  }

  hasChannelPermission(permission: ChannelPermission): boolean {
    // スーパー管理者は全ての権限を持つ
    if (this.isSuperAdmin) {
      return true
    }

    // サーバーオーナーは全ての権限を持つ
    if (this.server.ownerId === this.member.userId) {
      return true
    }

    // 役職の権限をチェック
    return this.roles.some(role => 
      role.permissions.includes('MANAGE_SERVER') || 
      role.permissions.includes(permission)
    )
  }

  // 新しい役職を作成する際のデフォルト権限を取得
  static getDefaultPermissions(role: ServerRole): ServerPermission[] {
    return DEFAULT_ROLE_PERMISSIONS[role] || []
  }

  // 新しいチャンネルを作成する際のデフォルト権限を取得
  static getDefaultChannelPermissions(role: ServerRole): ChannelPermission[] {
    return DEFAULT_CHANNEL_PERMISSIONS[role] || []
  }
} 