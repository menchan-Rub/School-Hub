type Action = "view" | "create" | "edit" | "delete"
type Resource = "users" | "announcements" | "settings" | "audit_logs" | "security" | "messages" | "servers" | "roles"
type RolePermissions = Record<Resource, Action[]>

const rolePermissions: Record<string, RolePermissions> = {
  super_admin: {
    users: ["view", "create", "edit", "delete"],
    announcements: ["view", "create", "edit", "delete"],
    settings: ["view", "edit"],
    audit_logs: ["view"],
    security: ["view", "edit"],
    messages: ["view", "delete"],
    servers: ["view", "create", "edit", "delete"],
    roles: ["view", "edit"]
  },
  admin: {
    users: ["view", "create", "edit"],
    announcements: ["view", "create", "edit", "delete"],
    settings: ["view"],
    audit_logs: ["view"],
    security: ["view"],
    messages: ["view", "delete"],
    servers: ["view", "edit"],
    roles: ["view"]
  },
  moderator: {
    users: ["view"],
    announcements: ["view", "create"],
    settings: ["view"],
    audit_logs: ["view"],
    security: ["view"],
    messages: ["view"],
    servers: ["view"],
    roles: ["view"]
  },
  user: {
    users: ["view"],
    announcements: ["view"],
    settings: ["view"],
    audit_logs: [],
    security: [],
    messages: [],
    servers: [],
    roles: []
  }
}

export function hasPermission(
  userRole: string,
  resource: Resource,
  action: Action
): boolean {
  // super_adminは全ての権限を持つ
  if (userRole === "super_admin") return true

  return rolePermissions[userRole as keyof typeof rolePermissions]?.[resource]?.includes(action) ?? false
} 