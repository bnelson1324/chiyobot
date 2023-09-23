const { SlashCommandBuilder } = require('@discordjs/builders');
const resourceManager = require('../res/resourceManager');
const insertOrIgnoreMember = require('../sql/utils').insertOrIgnoreMember;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('curse')
		.setDescription('Curse a user')
		.setDMPermission(false)
		.addUserOption(option =>
			option.setName('target')
				.setDescription('Target to curse')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('curse')
				.setDescription('Whether to curse or uncurse the user')
				.setRequired(true)),
	async setup(client) {
		// set up voice channel event
		client.on('voiceStateUpdate', async (oldState, newState) => {
			const member = await newState.client.db.get(`
				SELECT guild
				FROM curses
				WHERE guild = ? AND user = ?;
				`, newState.guild.id, newState.id,
			);
			disconnectAfterDelay(member)
		});
	},
	async execute(interaction) {
		const target = interaction.options.get('target');
		let replyText = target.user.tag;
		if (interaction.options.get('curse').value) {
			await insertOrIgnoreMember(interaction.client.db, interaction.guildId, target.value);
			await interaction.client.db.run(
				'INSERT OR IGNORE INTO curses (guild, user) VALUES (?, ?);',
				interaction.guildId, target.value,
			);

			// disconnect user from their current voice channel
			await disconnectAfterDelay(target.member)
			replyText += ' has been cursed';
		} else {
			await interaction.client.db.run(`
				DELETE FROM curses
				WHERE guild = ? AND user = ?;
				`, interaction.guildId, target.value,
			);
			replyText += ' has been uncursed';
		}
		await interaction.reply(replyText);
	},
	allowedInGuilds: true,
};

async function disconnectAfterDelay(member) {
	// kick the user in a random amount of time
	const timeout = Math.random() * 400;
	setTimeout(
		() => {
			if (member && member.voice) {
				member.voice.disconnect();
			}
		},
		timeout * 1000
	)
}
