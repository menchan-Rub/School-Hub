-- CreateTable
CREATE TABLE "SecurityPolicy" (
    "id" TEXT NOT NULL,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "passwordMaxLength" INTEGER NOT NULL DEFAULT 100,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "requireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "requireSpecialChars" BOOLEAN NOT NULL DEFAULT true,
    "passwordExpiryDays" INTEGER NOT NULL DEFAULT 90,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 60,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "passwordHistoryCount" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityPolicy_pkey" PRIMARY KEY ("id")
);
