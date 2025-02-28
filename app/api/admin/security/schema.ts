import { z } from "zod";

export const accountLockoutSchema = z.object({
  maxLoginAttempts: z.number().min(1).max(10),
  lockoutDuration: z.number().min(1),
  lockoutDurationType: z.enum(["minutes", "hours", "days"]),
  autoUnlock: z.boolean(),
  notifyAdmin: z.boolean(),
});

export const passwordPolicySchema = z.object({
  minLength: z.number().min(8).max(128),
  maxLength: z.number().min(8).max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSymbols: z.boolean(),
  expiryDays: z.number().min(0),
  historyCount: z.number().min(0),
  showStrengthMeter: z.boolean(),
});

export const mfaSettingsSchema = z.object({
  requireMFA: z.boolean(),
  allowedMethods: z.array(z.enum(["authenticator", "sms", "email"])),
  backupCodesCount: z.number().min(1).max(20),
  mfaGracePeriod: z.number().min(0),
  rememberDevice: z.boolean(),
  rememberDeviceDuration: z.number().min(1),
});

export const sessionSettingsSchema = z.object({
  sessionTimeout: z.number().min(1),
  timeoutUnit: z.enum(["minutes", "hours", "days"]),
  idleTimeout: z.number().min(1),
  idleTimeoutUnit: z.enum(["minutes", "hours"]),
  maxConcurrentSessions: z.number().min(1),
  forceLogoutOnPasswordChange: z.boolean(),
  forceLogoutOnRoleChange: z.boolean(),
  enableSessionMonitoring: z.boolean(),
});

export const ipRestrictionSchema = z.object({
  enableIPRestriction: z.boolean(),
  allowedIPs: z.array(z.string()),
  blockUnknownIPs: z.boolean(),
  notifyOnBlock: z.boolean(),
  logBlockedAttempts: z.boolean(),
});

export const wafSettingsSchema = z.object({
  enableWAF: z.boolean(),
  mode: z.enum(["detection", "prevention"]),
  rules: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      priority: z.number(),
    })
  ),
  customRules: z.array(
    z.object({
      id: z.string(),
      pattern: z.string(),
      action: z.enum(["block", "allow", "log"]),
      description: z.string(),
    })
  ),
  logLevel: z.enum(["debug", "info", "warn", "error"]),
  alertThreshold: z.number().min(1),
});

export const backupSettingsSchema = z.object({
  enableAutoBackup: z.boolean(),
  backupSchedule: z.enum(["hourly", "daily", "weekly", "monthly"]),
  backupTime: z.string(),
  retentionPeriod: z.number().min(1),
  backupTypes: z.object({
    database: z.boolean(),
    files: z.boolean(),
    configurations: z.boolean(),
  }),
  compressionEnabled: z.boolean(),
  encryptionEnabled: z.boolean(),
  storageLocation: z.enum(["local", "s3", "gcs"]),
  notifyOnSuccess: z.boolean(),
  notifyOnFailure: z.boolean(),
});

export const vulnerabilitySettingsSchema = z.object({
  enableScheduledScan: z.boolean(),
  scanSchedule: z.enum(["daily", "weekly", "monthly"]),
  scanTime: z.string(),
  scanTargets: z.object({
    webapp: z.boolean(),
    api: z.boolean(),
    database: z.boolean(),
    server: z.boolean(),
  }),
  notifyOnCompletion: z.boolean(),
  notifyOnVulnerability: z.boolean(),
  severityThreshold: z.enum(["critical", "high", "medium", "low"]),
  autoRemediation: z.boolean(),
});

export const securitySettingsSchema = z.object({
  accountLockout: accountLockoutSchema,
  passwordPolicy: passwordPolicySchema,
  mfaSettings: mfaSettingsSchema,
  sessionSettings: sessionSettingsSchema,
  ipRestriction: ipRestrictionSchema,
  wafSettings: wafSettingsSchema,
  backupSettings: backupSettingsSchema,
  vulnerabilitySettings: vulnerabilitySettingsSchema,
}); 