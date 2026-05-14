import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const qrStatuses = ["unused", "used", "flagged"] as const;

export const scanLogStatuses = [
  "success",
  "invalid_brute",
  "already_used",
  "failed_validation",
  "rate_limited",
  "system_error"
] as const;

export const systemErrorTypes = ["db_timeout", "network_failure", "validation_error"] as const;

const timestampNow = sql`(cast((julianday('now') - 2440587.5) * 86400000 as integer))`;

export const user = sqliteTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampNow)
  },
  (table) => [uniqueIndex("user_email_uidx").on(table.email), index("user_created_at_idx").on(table.createdAt)]
);

export const session = sqliteTable(
  "session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampNow),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
  },
  (table) => [uniqueIndex("session_token_uidx").on(table.token), index("session_user_id_idx").on(table.userId), index("session_expires_at_idx").on(table.expiresAt)]
);

export const account = sqliteTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampNow)
  },
  (table) => [index("account_user_id_idx").on(table.userId), index("account_provider_account_idx").on(table.providerId, table.accountId)]
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampNow),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(timestampNow)
  },
  (table) => [index("verification_identifier_idx").on(table.identifier), index("verification_expires_at_idx").on(table.expiresAt)]
);

export const qrMaster = sqliteTable(
  "qr_master",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id").notNull(),
    uniqueCode: text("unique_code").notNull(),
    status: text("status", { enum: qrStatuses }).notNull().default("unused"),
    used: integer("used", { mode: "boolean" }).notNull().default(false),
    source: text("source").notNull().default("csv"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(timestampNow),
    usedAt: integer("used_at", { mode: "timestamp_ms" })
  },
  (table) => [
    uniqueIndex("qr_master_unique_code_uidx").on(table.uniqueCode),
    index("qr_master_campaign_id_idx").on(table.campaignId),
    index("qr_master_status_idx").on(table.status),
    index("qr_master_used_idx").on(table.used),
    index("qr_master_campaign_status_idx").on(table.campaignId, table.status),
    check("qr_master_status_check", sql`${table.status} in ('unused', 'used', 'flagged')`),
    check("qr_master_unique_code_format_check", sql`${table.uniqueCode} glob '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'`),
    check("qr_master_source_check", sql`length(${table.source}) > 0`)
  ]
);

export const scanLogs = sqliteTable(
  "scan_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    campaignId: text("campaign_id").notNull(),
    uniqueCode: text("unique_code").notNull(),
    fullName: text("full_name"),
    phoneWa: text("phone_wa"),
    age: integer("age"),
    warungName: text("warung_name"),
    status: text("status", { enum: scanLogStatuses }).notNull(),
    ipAddress: text("ip_address").notNull(),
    errorType: text("error_type", { enum: systemErrorTypes }),
    attemptedAt: integer("attempted_at", { mode: "timestamp_ms" }).notNull().default(timestampNow)
  },
  (table) => [
    index("scan_logs_campaign_id_idx").on(table.campaignId),
    index("scan_logs_unique_code_idx").on(table.uniqueCode),
    index("scan_logs_phone_wa_idx").on(table.phoneWa),
    index("scan_logs_ip_address_idx").on(table.ipAddress),
    index("scan_logs_attempted_at_idx").on(table.attemptedAt),
    index("scan_logs_campaign_status_idx").on(table.campaignId, table.status),
    index("scan_logs_campaign_attempted_at_idx").on(table.campaignId, table.attemptedAt),
    index("scan_logs_phone_campaign_idx").on(table.phoneWa, table.campaignId),
    index("scan_logs_ip_attempted_at_idx").on(table.ipAddress, table.attemptedAt),
    index("scan_logs_code_campaign_idx").on(table.uniqueCode, table.campaignId),
    check("scan_logs_status_check", sql`${table.status} in ('success', 'invalid_brute', 'already_used', 'failed_validation', 'rate_limited', 'system_error')`),
    check("scan_logs_error_type_check", sql`${table.errorType} is null or ${table.errorType} in ('db_timeout', 'network_failure', 'validation_error')`),
    check("scan_logs_unique_code_format_check", sql`${table.uniqueCode} glob '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'`),
    check("scan_logs_age_check", sql`${table.age} is null or ${table.age} >= 0`),
    check("scan_logs_phone_wa_format_check", sql`${table.phoneWa} is null or ${table.phoneWa} glob '62[0-9]*'`)
  ]
);

export type QrMaster = typeof qrMaster.$inferSelect;
export type NewQrMaster = typeof qrMaster.$inferInsert;
export type ScanLog = typeof scanLogs.$inferSelect;
export type NewScanLog = typeof scanLogs.$inferInsert;
export type AuthUser = typeof user.$inferSelect;
export type AuthSession = typeof session.$inferSelect;
export type AuthAccount = typeof account.$inferSelect;
export type AuthVerification = typeof verification.$inferSelect;

export type QrStatus = (typeof qrStatuses)[number];
export type ScanLogStatus = (typeof scanLogStatuses)[number];
export type SystemErrorType = (typeof systemErrorTypes)[number];
