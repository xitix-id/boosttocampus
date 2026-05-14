CREATE TABLE `qr_master` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`unique_code` text NOT NULL,
	`status` text DEFAULT 'unused' NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	`source` text DEFAULT 'csv' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	`used_at` integer,
	CONSTRAINT "qr_master_status_check" CHECK("qr_master"."status" in ('unused', 'used', 'flagged')),
	CONSTRAINT "qr_master_unique_code_format_check" CHECK("qr_master"."unique_code" glob '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'),
	CONSTRAINT "qr_master_source_check" CHECK(length("qr_master"."source") > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qr_master_unique_code_uidx` ON `qr_master` (`unique_code`);--> statement-breakpoint
CREATE INDEX `qr_master_campaign_id_idx` ON `qr_master` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `qr_master_status_idx` ON `qr_master` (`status`);--> statement-breakpoint
CREATE INDEX `qr_master_used_idx` ON `qr_master` (`used`);--> statement-breakpoint
CREATE INDEX `qr_master_campaign_status_idx` ON `qr_master` (`campaign_id`,`status`);--> statement-breakpoint
CREATE TABLE `scan_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`unique_code` text NOT NULL,
	`full_name` text,
	`phone_wa` text,
	`age` integer,
	`warung_name` text,
	`status` text NOT NULL,
	`ip_address` text NOT NULL,
	`error_type` text,
	`attempted_at` integer DEFAULT (cast((julianday('now') - 2440587.5) * 86400000 as integer)) NOT NULL,
	CONSTRAINT "scan_logs_status_check" CHECK("scan_logs"."status" in ('success', 'invalid_brute', 'already_used', 'failed_validation', 'rate_limited', 'system_error')),
	CONSTRAINT "scan_logs_error_type_check" CHECK("scan_logs"."error_type" is null or "scan_logs"."error_type" in ('db_timeout', 'network_failure', 'validation_error')),
	CONSTRAINT "scan_logs_unique_code_format_check" CHECK("scan_logs"."unique_code" glob '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'),
	CONSTRAINT "scan_logs_age_check" CHECK("scan_logs"."age" is null or "scan_logs"."age" >= 0),
	CONSTRAINT "scan_logs_phone_wa_format_check" CHECK("scan_logs"."phone_wa" is null or "scan_logs"."phone_wa" glob '62[0-9]*')
);
--> statement-breakpoint
CREATE INDEX `scan_logs_campaign_id_idx` ON `scan_logs` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `scan_logs_unique_code_idx` ON `scan_logs` (`unique_code`);--> statement-breakpoint
CREATE INDEX `scan_logs_phone_wa_idx` ON `scan_logs` (`phone_wa`);--> statement-breakpoint
CREATE INDEX `scan_logs_ip_address_idx` ON `scan_logs` (`ip_address`);--> statement-breakpoint
CREATE INDEX `scan_logs_attempted_at_idx` ON `scan_logs` (`attempted_at`);--> statement-breakpoint
CREATE INDEX `scan_logs_campaign_status_idx` ON `scan_logs` (`campaign_id`,`status`);--> statement-breakpoint
CREATE INDEX `scan_logs_campaign_attempted_at_idx` ON `scan_logs` (`campaign_id`,`attempted_at`);--> statement-breakpoint
CREATE INDEX `scan_logs_phone_campaign_idx` ON `scan_logs` (`phone_wa`,`campaign_id`);--> statement-breakpoint
CREATE INDEX `scan_logs_ip_attempted_at_idx` ON `scan_logs` (`ip_address`,`attempted_at`);--> statement-breakpoint
CREATE INDEX `scan_logs_code_campaign_idx` ON `scan_logs` (`unique_code`,`campaign_id`);
