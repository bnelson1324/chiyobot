const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping a user')
		.setDMPermission(false)
		.addUserOption(option =>
			option.setName('target')
				.setDescription('User to ping')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('quantity')
				.setDescription('Number of times to ping user')
				.setMinValue(1)
				.setMaxValue(30)
				.setRequired(true))
		.addStringOption(option =>
			option.setName('message')
				.setDescription('Message to send with the ping')
				.setRequired(false)),
	async execute(interaction) {
		interaction.reply('User has been pinged');

		let pingMessage = `<@${interaction.options.get('target').value}>`;
		const userMessage = interaction.options.get('message');
		if (userMessage) {
			pingMessage += ' ' + userMessage.value;
		}
		for (let i = 0; i < interaction.options.get('quantity').value; i++) {
			await interaction.channel.send(pingMessage);
		}
	},
	allowedInGuilds: true,
};