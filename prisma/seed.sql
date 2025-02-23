-- super_adminロールを作成
INSERT INTO "Role" (id, name, permissions) 
VALUES (
  'role_super_admin',
  'Super Admin',
  '{
    "users": ["view", "create", "edit", "delete"],
    "announcements": ["view", "create", "edit", "delete"],
    "settings": ["view", "edit"],
    "audit_logs": ["view"],
    "security": ["view", "edit"],
    "messages": ["view", "delete"],
    "servers": ["view", "create", "edit", "delete"],
    "roles": ["view", "edit"]
  }'
);

-- 初期管理者ユーザーを作成
INSERT INTO "User" (
  id, 
  name, 
  email, 
  password,
  "roleId",
  status
) 
VALUES (
  'user_super_admin',
  'システム管理者',
  'admin@school-hub.com',
  '$2b$10$eYoPSbfRCoQxWNdxyJZQf.om5eozrrrhZVRMRohoCcl2pr7TMBlQq',  -- "Admin123!"のハッシュ値
  'role_super_admin',
  'active'
); 