CREATE TABLE `ai_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`provider` text DEFAULT 'custom' NOT NULL,
	`base_url` text,
	`api_key` text,
	`default_model` text DEFAULT 'minimax/minimax-m3' NOT NULL,
	`custom_models` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_settings_organization_id_idx` ON `ai_settings` (`organization_id`);