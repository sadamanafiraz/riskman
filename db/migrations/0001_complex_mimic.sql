CREATE TABLE `risk_counties` (
	`id` text PRIMARY KEY NOT NULL,
	`class_id` text NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`started_at` text,
	FOREIGN KEY (`class_id`) REFERENCES `risk_classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `risk_groups` ADD `county_id` text REFERENCES risk_counties(id);