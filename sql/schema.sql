CREATE TABLE IF NOT EXISTS members
(
	guild text,
	user text,
	PRIMARY KEY (guild, user)
);

CREATE TABLE IF NOT EXISTS vcbans
(
	guild text,
	user text,
	PRIMARY KEY (guild, user),
	FOREIGN KEY(guild, user) REFERENCES members(guild, user)
);