-- Applied once through d1_migrations by both the Node and D1 migration runners.
ALTER TABLE `app_settings` ADD `outbound_provider` text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE `app_settings` ADD `outbound_fallback` integer DEFAULT 1 NOT NULL;
