CREATE TABLE `risk_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`code` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`duration` integer DEFAULT 120 NOT NULL,
	`created_at` text NOT NULL,
	`bank_version` text DEFAULT 'riskman-v2-20261110' NOT NULL,
	`demo` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `risk_classes_code_unique` ON `risk_classes` (`code`);--> statement-breakpoint
CREATE TABLE `risk_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`opd` text NOT NULL,
	`position` integer NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`started_at` text,
	`submitted_at` text,
	`updated_at` text,
	`result` text,
	FOREIGN KEY (`class_id`) REFERENCES `risk_classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `risk_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`group_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `risk_classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`group_id`) REFERENCES `risk_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_group_per_user_class` ON `risk_memberships` (`class_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `one_owner_per_group` ON `risk_memberships` (`group_id`);