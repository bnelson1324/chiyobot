const { SlashCommandBuilder } = require('@discordjs/builders');
const resourceManager = require('../res/resourceManager');
const insertOrIgnoreMember = require('../sql/utils').insertOrIgnoreMember;

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
		let replyText = target.user.tag;
		if (interaction.options.get('ban').value) {
			await insertOrIgnoreMember(interaction.client.db, interaction.guildId, target.value);
			await interaction.client.db.run(
				'INSERT OR IGNORE INTO vcbans (guild, user) VALUES (?, ?);',
				interaction.guildId, target.value,
			);

			// disconnect user from their current voice channel
			await target.member.voice.disconnect();

			replyText += ' has been banned from voice channels';
		} else {
			await interaction.client.db.run(`
				DELETE FROM vcbans
				WHERE guild = ? AND user = ?;
				`, interaction.guildId, target.value,
			);
			replyText += ' has been unbanned from voice channels';
		}
		await interaction.reply(replyText);
	},
	allowedInGuilds: true,
};