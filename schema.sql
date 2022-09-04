CREATE TABLE IF NOT EXISTS members
(
	guild text,
	user text,
	PRIMARY KEY (guild, user)
);

-- /manageperms
CREATE TABLE IF NOT EXISTS requiredRoles
(
	guild text,
	requiredRole text NOT NULL,
	PRIMARY KEY (guild),
	FOREIGN KEY(guild) REFERENCES members(guild)
);

CREATE TABLE IF NOT EXISTS blockedMembers
(
	guild text,
	user text,
	PRIMARY KEY (guild, user),
	FOREIGN KEY(guild, user) REFERENCES members(guild, user)
);

-- /vcban
CREATE TABLE IF NOT EXISTS vcbans
(
	guild text,
	user text,
	PRIMARY KEY (guild, user),
	FOREIGN KEY(guild, user) REFERENCES members(guild, user)
);