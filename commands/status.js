const { SlashCommandBuilder } = require('@discordjs/builders');
const perms = require('../commands/manageperms');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Check your status with Chiyo on all guilds'),
	async execute(interaction) {
		let statusText = '';
		const statusRows = await interaction.client.db.all(`
			SELECT guilds.id AS guild, blockedMembers.guild AS blockedGuild, vcbans.guild AS vcbanGuild
			FROM guilds
			LEFT JOIN users
			LEFT JOIN blockedMembers
				ON users.id = blockedMembers.user AND guilds.id = blockedMembers.guild
			LEFT JOIN vcbans
				ON users.id = vcbans.user AND guilds.id = vcbans.guild
			WHERE users.id = $userId AND ($guildId IS NULL OR guilds.id = $guildId);
		`, {
			$guildId: interaction.guildId,
			$userId: interaction.user.id,
		});

		// if no information on user or guild exists
		if (statusRows.length === 0) {
			await interaction.reply('Information about user or guild not stored in database');
			return;
		}

		// format reply
		for (const row of statusRows) {
			statusText += await formatGuildStatus(row, interaction.client, interaction.user.id) + '\n';
		}

		// send status in DMs
		if (interaction.guild == null) {
			interaction.reply(`Status in guilds:\n\n ${statusText}`);
		} else {
			await interaction.user.send(`Status in guild: ${statusText}`);
			interaction.reply('Status sent');
		}
	},
	allowedInGuilds: true,
};

async function formatGuildStatus(row, client, userId) {
	const guild = await client.guilds.fetch(row.guild);
	const member = await guild.members.fetch(userId);
	let statusText = guild.name + '\n';
	statusText = addToStatusText(await perms.hasPerms(client.db, member, guild), 'have perms', 'do not have perms', statusText);
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