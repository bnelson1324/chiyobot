CREATE TABLE IF NOT EXISTS vcbans
(
	guild text,
	user text,
	PRIMARY KEY (guild, user)
);