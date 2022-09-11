/* utility functions for the database */

module.exports = {
	async insertOrIgnoreMember(db, guildId, userId) {
		await db.run('INSERT OR IGNORE INTO guilds (id) VALUES (?);', guildId);
		await db.run('INSERT OR IGNORE INTO users (id) VALUES (?);', userId);
	},
};