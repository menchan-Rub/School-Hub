export interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastLogin: string
  banType?: "temporary" | "permanent"
}

export type SecuritySettings = {
  accountLockout: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    lockoutDurationType: "minutes" | "hours" | "days";
    autoUnlock: boolean;
    notifyAdmin: boolean;
  };
  passwordPolicy: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    expiryDays: number;
    historyCount: number;
    showStrengthMeter: boolean;
  };
  mfaSettings: {
    requireMFA: boolean;
    allowedMethods: ("authenticator" | "sms" | "email")[];
    backupCodesCount: number;
    mfaGracePeriod: number;
    rememberDevice: boolean;
    rememberDeviceDuration: number;
  };
  sessionSettings: {
    sessionTimeout: number;
    timeoutUnit: "minutes" | "hours" | "days";
    idleTimeout: number;
    idleTimeoutUnit: "minutes" | "hours";
    maxConcurrentSessions: number;
    forceLogoutOnPasswordChange: boolean;
    forceLogoutOnRoleChange: boolean;
    enableSessionMonitoring: boolean;
  };
  ipRestriction: {
    enableIPRestriction: boolean;
    allowedIPs: string[];
    blockUnknownIPs: boolean;
    notifyOnBlock: boolean;
    logBlockedAttempts: boolean;
  };
  wafSettings: {
    enableWAF: boolean;
    mode: "detection" | "prevention";
    rules: {
      id: string;
      name: string;
      enabled: boolean;
      priority: number;
    }[];
    customRules: {
      id: string;
      pattern: string;
      action: "block" | "allow" | "log";
      description: string;
    }[];
    logLevel: "debug" | "info" | "warn" | "error";
    alertThreshold: number;
  };
  backupSettings: {
    enableAutoBackup: boolean;
    backupSchedule: "hourly" | "daily" | "weekly" | "monthly";
    backupTime: string;
    retentionPeriod: number;
    backupTypes: {
      database: boolean;
      files: boolean;
      configurations: boolean;
    };
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    storageLocation: "local" | "s3" | "gcs";
    notifyOnSuccess: boolean;
    notifyOnFailure: boolean;
  };
  vulnerabilitySettings: {
    enableScheduledScan: boolean;
    scanSchedule: "daily" | "weekly" | "monthly";
    scanTime: string;
    scanTargets: {
      webapp: boolean;
      api: boolean;
      database: boolean;
      server: boolean;
    };
    notifyOnCompletion: boolean;
    notifyOnVulnerability: boolean;
    severityThreshold: "critical" | "high" | "medium" | "low";
    autoRemediation: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}; 