CREATE TABLE `appConfig` (
	`key` varchar(120) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appConfig_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `editorialTexts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sourceId` int,
	`slideId` int,
	`bloco` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`status` enum('draft','review','approved') NOT NULL DEFAULT 'draft',
	CONSTRAINT `editorialTexts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`format` enum('json','markdown') NOT NULL,
	`scope` enum('approved','all') NOT NULL DEFAULT 'approved',
	`slideCount` int NOT NULL,
	`generatedContent` text NOT NULL,
	CONSTRAINT `exportHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`name` varchar(180) NOT NULL,
	`description` text,
	`orderIndex` int NOT NULL,
	CONSTRAINT `reportSections_id` PRIMARY KEY(`id`),
	CONSTRAINT `reportSections_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `slideVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slideId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int,
	`versionNumber` int NOT NULL,
	`title` varchar(320) NOT NULL,
	`content` text NOT NULL,
	`notes` text,
	`kpiMain` varchar(320),
	`bullets` json NOT NULL,
	`sourceFooter` text,
	`status` enum('draft','review','approved') NOT NULL,
	CONSTRAINT `slideVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `slideVersions_slide_version_unique` UNIQUE(`slideId`,`versionNumber`)
);
--> statement-breakpoint
CREATE TABLE `slides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`sectionId` int,
	`deckCode` varchar(24) NOT NULL,
	`orderIndex` int NOT NULL,
	`title` varchar(320) NOT NULL,
	`content` text NOT NULL,
	`notes` text,
	`kpiMain` varchar(320),
	`bullets` json NOT NULL,
	`sourceFooter` text,
	`status` enum('draft','review','approved') NOT NULL DEFAULT 'draft',
	`lastEditedBy` int,
	CONSTRAINT `slides_id` PRIMARY KEY(`id`),
	CONSTRAINT `slides_deckCode_unique` UNIQUE(`deckCode`),
	CONSTRAINT `slides_orderIndex_unique` UNIQUE(`orderIndex`)
);
--> statement-breakpoint
CREATE TABLE `sourceSlides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`slideId` int NOT NULL,
	`relevanceNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sourceSlides_id` PRIMARY KEY(`id`),
	CONSTRAINT `sourceSlides_unique_link` UNIQUE(`sourceId`,`slideId`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	`inputType` enum('url','text','upload') NOT NULL,
	`inputText` text,
	`sourceUrl` text,
	`fileName` varchar(512),
	`fileMimeType` varchar(160),
	`storageKey` varchar(512),
	`title` varchar(320),
	`classification` json,
	`extractedInsights` json,
	`suggestedSlideCodes` json,
	`processingStatus` enum('pending','processing','done','error') NOT NULL DEFAULT 'pending',
	`processingError` text,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamAccess_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamAccess_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `editorialTexts` ADD CONSTRAINT `editorialTexts_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `editorialTexts` ADD CONSTRAINT `editorialTexts_slideId_slides_id_fk` FOREIGN KEY (`slideId`) REFERENCES `slides`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exportHistory` ADD CONSTRAINT `exportHistory_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slideVersions` ADD CONSTRAINT `slideVersions_slideId_slides_id_fk` FOREIGN KEY (`slideId`) REFERENCES `slides`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slideVersions` ADD CONSTRAINT `slideVersions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slides` ADD CONSTRAINT `slides_sectionId_reportSections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `reportSections`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `slides` ADD CONSTRAINT `slides_lastEditedBy_users_id_fk` FOREIGN KEY (`lastEditedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceSlides` ADD CONSTRAINT `sourceSlides_sourceId_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `sources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceSlides` ADD CONSTRAINT `sourceSlides_slideId_slides_id_fk` FOREIGN KEY (`slideId`) REFERENCES `slides`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sources` ADD CONSTRAINT `sources_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;