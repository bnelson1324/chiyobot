const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('commandhistory')
		.setDescription('See history of all commands used in the guild')
		.setDMPermission(false)
		.addIntegerOption(option =>
			option.setName('timezone')
				.setDescription('Offset from UTC timezone')
				.setMinValue(-12)
				.setMaxValue(14)
				.setRequired(false)),
	async execute(interaction) {
		// get command history
		let timezoneOffset = interaction.options.get('timezone')?.value;
		if (!timezoneOffset) {
			timezoneOffset = 0;
		}
		const commandHistory = await interaction.client.db.all(`
			SELECT guildId,
				userId,
				DATETIME(timestamp, 'unixepoch', ? || ' hours') AS datetime,
				commandName,
				commandParameters
			FROM commandHistory
			WHERE guildId = ?
			ORDER BY timestamp DESC;
			`, timezoneOffset, interaction.guildId,
		);

		// format reply
		let historyText = interaction.guild.name + '\n';
		await interaction.user.send(`Command history in guild: ${historyText}`);
		await interaction.reply('Command history sent');
	},
	allowedInGuilds: true,
	addCommandInstance,
};

async function addCommandInstance(interaction) {
	// get command name, with subcommand
	let commandName = interaction.commandName;
	const subCommandName = interaction.options._subcommand;
	if (subCommandName) {
		commandName += ` ${subCommandName}`;
	}

	// get parameters of command
	const commandOptions = {};
	for (const opt of interaction.options._hoistedOptions) {
		commandOptions[opt.name] = opt.value;
	}

	// insert into db
	await interaction.client.db.run(`
		INSERT INTO commandHistory (guildId, userId, timestamp, commandName, commandParameters)
		VALUES (?, ?, UNIXEPOCH(), ?, ?);
	`, interaction.guildId, interaction.user.id, commandName, JSON.stringify(commandOptions));
}