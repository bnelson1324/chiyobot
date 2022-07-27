const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping a user')
		.addUserOption(option =>
			option.setName('user')
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

		let pingMessage = `<@${interaction.options.get('user').user.id}>`;
		const userMessage = interaction.options.get('message');
		if (userMessage) {
			pingMessage += ' ' + userMessage.value;
		}
		const channel = await interaction.client.channels.fetch(interaction.channelId);
		for (let i = 0; i < interaction.options.get('quantity').value; i++) {
			await channel.send(pingMessage);
		}
	},
};