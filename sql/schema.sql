CREATE TABLE IF NOT EXISTS members
(
	guild TEXT,
	user TEXT,
	PRIMARY KEY (guild, user)
);

-- /commandhistory
CREATE TABLE IF NOT EXISTS commandHistory
(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	guildId TEXT,
	userId TEXT NOT NULL,
	timestamp INTEGER NOT NULL,
	commandName TEXT NOT NULL,
	commandParameters TEXT, --command options as JSON
	FOREIGN KEY (guildId, userId) REFERENCES members (guild, user)
);

-- /manageperms
CREATE TABLE IF NOT EXISTS requiredRoles
(
	guild TEXT,
	requiredRole TEXT NOT NULL,
	PRIMARY KEY (guild),
	FOREIGN KEY (guild) REFERENCES members (guild)
);

CREATE TABLE IF NOT EXISTS blockedMembers
(
	guild TEXT,
	user TEXT,
	PRIMARY KEY (guild, user),
	FOREIGN KEY (guild, user) REFERENCES members (guild, user)
);

-- /vcban
CREATE TABLE IF NOT EXISTS vcbans
(
	guild TEXT,
	user TEXT,
	PRIMARY KEY (guild, user),
	FOREIGN KEY (guild, user) REFERENCES members (guild, user)
);