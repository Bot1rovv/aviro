CREATE TABLE `image_search_session` (
	`id` text PRIMARY KEY NOT NULL,
	`results` text NOT NULL,
	`image_ids` text,
	`sources` text NOT NULL,
	`page_size` integer NOT NULL,
	`current_page` integer NOT NULL,
	`total_pages` integer,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total` text NOT NULL,
	`items` text NOT NULL,
	`tracking_number` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`product_id` text,
	`product_title` text,
	`product_price` text,
	`product_image` text,
	`details` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `password` text;--> statement-breakpoint
ALTER TABLE `user` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `user` ADD `address_data` text;