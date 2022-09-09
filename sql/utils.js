/* utility functions for the database */

module.exports = {
	async insertOrIgnoreMember(db, guildId, userId) {
		await db.run(
			'INSERT OR IGNORE INTO members (guild, user) VALUES (?, ?);',
			guildId, userId,
		);
	},
};