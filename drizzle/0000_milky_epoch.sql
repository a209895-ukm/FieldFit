CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`record` text,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_workspace_created` ON `audit` (`workspace`,`created`);--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`kind` text NOT NULL,
	`performance` text,
	`token_hash` text NOT NULL,
	`session_hash` text,
	`status` text NOT NULL,
	`language` text NOT NULL,
	`created` text NOT NULL,
	`expires` text NOT NULL,
	`started` text,
	`submitted` text,
	`consent` text,
	`snapshot` text NOT NULL,
	`answers` text NOT NULL,
	`conversation` text NOT NULL,
	`scores` text,
	`review` text,
	`decision` text,
	`outcomes` text NOT NULL,
	`switches` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidates_token_hash_unique` ON `candidates` (`token_hash`);--> statement-breakpoint
CREATE INDEX `candidates_workspace` ON `candidates` (`workspace`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `members_email` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`settings` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_owner_unique` ON `workspaces` (`owner`);