const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('displace')
		.setDescription('Move around a user in VC')
		.setDMPermission(false)
		.addUserOption(option =>
			option.setName('target')
				.setDescription('User to displace')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('duration')
				.setDescription('Number seconds to displace user for	')
				.setMinValue(1)
				.setMaxValue(10)
				.setRequired(true)),
	async execute(interaction) {
		const targetVoiceState = interaction.options.get('target').member.voice;
		if (!targetVoiceState.channel) {
			await interaction.reply('User is not currently in a voice channel');
			return;
		}
		const vcChannels = interaction.guild.channels.cache.filter(channel => channel.type == 'GUILD_VOICE');
		let duration = interaction.options.get('duration').value;
		if (!duration) { duration = 5; }
		const stopTime = new Date().getTime() + (duration * 1000);
		interaction.reply('User has been displaced');

		// move target around for duration
		await moveUser(targetVoiceState, vcChannels, stopTime);
	},
	allowedInGuilds: true,
};

async function moveUser(targetVoiceState, vcChannels, stopTime) {
	try {
		await targetVoiceState.setChannel(vcChannels.filter(channel => channel != targetVoiceState.channel).random());
		// repeat function if stopTime has not passed yet
		if (new Date().getTime() < stopTime) {
			setTimeout(moveUser, 300, targetVoiceState, vcChannels, stopTime);
		}
	} catch (error) {
		// catches error if user leaves voice channel
		if (error.code != 40032) {
			console.error(error);
		}
	}
}