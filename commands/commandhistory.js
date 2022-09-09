const { SlashCommandBuilder } = require('@discordjs/builders');
const insertOrIgnoreMember = require('../sql/utils').insertOrIgnoreMember;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('commandhistory')
		.setDescription('See history of all commands used in the guild')
		.setDMPermission(false),
	async execute(interaction) {
		const commandHistory = await interaction.client.db.all(`
			SELECT * FROM commandHistory
			WHERE guildId = ?
			ORDER BY timestamp DESC;
		`, interaction.guildId);
		console.log(commandHistory);
		await interaction.reply('command history printed to console');
	},
	allowedInGuilds: true,
	addCommandInstance,
};

async function addCommandInstance(interaction) {
	const commandOptions = {};
	for (const opt of interaction.options._hoistedOptions) {
		commandOptions[opt.name] = opt.value;
	}
	await interaction.client.db.run(`
		INSERT INTO commandHistory (guildId, userId, timestamp, commandName, commandParameters)
		VALUES (?, ?, UNIXEPOCH(), ?, ?);
	`, interaction.guildId, interaction.user.id, interaction.commandName, JSON.stringify(commandOptions));
}