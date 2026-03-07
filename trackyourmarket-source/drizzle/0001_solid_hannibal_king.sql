CREATE TABLE `news_articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`source` varchar(128) NOT NULL,
	`publishedAt` timestamp NOT NULL,
	`summary` text,
	`companies` text,
	`relevanceIndex` int NOT NULL,
	`eventType` varchar(64) DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `news_articles_id` PRIMARY KEY(`id`)
);
