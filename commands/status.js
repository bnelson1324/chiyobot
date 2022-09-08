const { SlashCommandBuilder } = require('@discordjs/builders');
const perms = require('../commands/manageperms');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Check your status with Chiyo on all guilds'),
	async execute(interaction) {
		// select all entries from vctable where member is the same as the userinteraction.user.id
		let statusText = 'Status in guilds:\n\n';
		const statusRows = await interaction.client.db.all(`
		SELECT members.guild, blockedMembers.guild AS blockedGuild, vcbans.guild AS vcbanGuild
		FROM members
		LEFT JOIN blockedMembers
			ON members.user = blockedMembers.user AND members.guild = blockedMembers.guild
		LEFT JOIN vcbans
			ON members.user = vcbans.user AND members.guild = vcbans.guild
		WHERE members.user = $userId AND ($guildId IS NULL OR members.guild = $guildId) ;
		`, {
			$guildId: interaction.guildId,
			$userId: interaction.user.id,
		});
		for (const row of statusRows) {
			statusText += await formatGuildStatus(row, interaction.client, interaction.user.id) + '\n';
		}

		interaction.reply(statusText);
	},
	allowedInGuilds: true,
};

async function formatGuildStatus(row, client, userId) {
	const guild = await client.guilds.fetch(row.guild);
	const member = await guild.members.fetch(userId);
	let statusText = guild.name + '\n';
	statusText = addToStatusText(await perms.hasPerms(client.db, member, guild), 'has perms', 'do not have perms', statusText);
	statusText = addToStatusText(row.blockedGuild != null, 'blocked', null, statusText);
	statusText = addToStatusText(row.vcbanGuild != null, 'banned from voice channels', null, statusText);
	return statusText;
}

function addToStatusText(condition, trueText, falseText, currentStatusText) {
	if (condition && trueText != null) {
		return currentStatusText + '\t• ' + trueText + '\n';
	} else if (!condition && falseText != null) {
		return currentStatusText + '\t• ' + falseText + '\n';
	} else {
		return currentStatusText;
	}
}