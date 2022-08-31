const { SlashCommandBuilder } = require('@discordjs/builders');
const Sequelize = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vcban')
		.setDescription('Ban a user from voice channels')
		.addUserOption(option =>
			option.setName('target')
				.setDescription('Target to ban')
				.setRequired(true))
		.addBooleanOption(option =>
			option.setName('ban')
				.setDescription('Whether to ban or unban the user')
				.setRequired(true)),
	async setup(client) {
		// create database table
		client.sequelize.define('vcban', {
			guild: {
				type: Sequelize.STRING,
				primaryKey: true,
				allowNull: false,
			},
			user: {
				type: Sequelize.STRING,
				primaryKey: true,
				allowNull: false,
			},
		});

		// set up voice channel event
		client.on('voiceStateUpdate', async (oldState, newState) => {
			const member = await newState.client.getModel('vcban').findOne({
				attributes: ['guild'],
				where: { guild: newState.guild.id, user: newState.id },
			});
			if (member) {
				newState.disconnect();
				if (newState.channel != null) {
					newState.member.send('YOU WILL DO NO SUCH THING');
				}
			}
		});
	},
	async execute(interaction) {
		const target = interaction.options.get('target');
		if (interaction.options.get('ban').value) {
			await interaction.client.getModel('vcban').findOrCreate({
				where: {
					guild: interaction.guildId,
					user: target.value,
				},
			});

			// disconnect user from their current voice channel
			target.member.voice.disconnect();

			interaction.reply(`${target.user.username} has been banned from voice channels`);
		} else {
			await interaction.client.getModel('vcban').destroy({ where: { guild: interaction.guildId, user: target.value } });
			interaction.reply(`${target.user.username} has been unbanned from voice channels`);
		}
	},
};