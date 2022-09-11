CREATE TABLE IF NOT EXISTS guilds
(
	id TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE IF NOT EXISTS users
(
	id TEXT PRIMARY KEY NOT NULL
);

-- /commandhistory
CREATE TABLE IF NOT EXISTS commandHistory
(
	id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	guildId TEXT,
	userId TEXT NOT NULL,
	timestamp INTEGER NOT NULL,
	commandName TEXT NOT NULL,
	commandParameters TEXT, --command options as JSON
	FOREIGN KEY (guildId) REFERENCES guilds (id),
	FOREIGN KEY (userId) REFERENCES users (id)
);

-- /manageperms
CREATE TABLE IF NOT EXISTS requiredRoles
(
	guild TEXT NOT NULL,
	requiredRole TEXT NOT NULL,
	PRIMARY KEY (guild),
	FOREIGN KEY (guild) REFERENCES guilds (id)
);

CREATE TABLE IF NOT EXISTS blockedMembers
(
	guild TEXT NOT NULL,
	user TEXT NOT NULL,
	PRIMARY KEY (guild, user),
	FOREIGN KEY (guild) REFERENCES guilds (id),
	FOREIGN KEY (user) REFERENCES users (id)
);

-- /vcban
CREATE TABLE IF NOT EXISTS vcbans
(
	guild TEXT NOT NULL,
	user TEXT NOT NULL,
	PRIMARY KEY (guild, user),
	FOREIGN KEY (guild) REFERENCES guilds (id),
	FOREIGN KEY (user) REFERENCES users (id)
);