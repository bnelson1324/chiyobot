const { SlashCommandBuilder } = require('@discordjs/builders');
const resourceManager = require('../res/resourceManager');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vcban')
		.setDescription('Ban a user from voice channels')
		.setDMPermission(false)
		.addUserOption(option =>
			option.setName('target')
				.setDescription('Target to ban')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('ban')
				.setDescription('Whether to ban or unban the user')
				.setRequired(true)),
	async setup(client) {
		// set up voice channel event
		client.on('voiceStateUpdate', async (oldState, newState) => {
			const member = await newState.client.db.get(`
				SELECT guild
				FROM vcbans
				WHERE guild = ? AND user = ?;
				`, newState.guild.id, newState.id,
			);
			if (member) {
				newState.disconnect();
				if (newState.channel != null) {
					newState.member.send({ files: [resourceManager.getPenguinImage()] });
				}
			}
		});
	},
	async execute(interaction) {
		const target = interaction.options.get('target');
		if (interaction.options.get('ban').value) {
			await interaction.client.db.run(
				'INSERT OR IGNORE INTO members VALUES (?, ?);',
				interaction.guildId, target.value,
			);
			await interaction.client.db.run(
				'INSERT OR IGNORE INTO vcbans VALUES (?, ?);',
				interaction.guildId, target.value,
			);

			// disconnect user from their current voice channel
			target.member.voice.disconnect();

			interaction.reply(`${target.user.username} has been banned from voice channels`);
		} else {
			await interaction.client.db.run(`
				DELETE FROM vcbans
				WHERE guild = ? AND user = ?;
				`, interaction.guildId, target.value,
			);
			interaction.reply(`${target.user.username} has been unbanned from voice channels`);
		}
	},
	allowedInGuilds: true,
};