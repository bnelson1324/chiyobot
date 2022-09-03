const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('manageperms')
		.setDescription('Manage Chiyo perms for this guild (Owner Only)')
		.setDMPermission(false)
		.addSubcommand(subcommand =>
			subcommand.setName('requirerole')
				.setDescription('Require a certain role to use Chiyo (Owner Only)')
				.addRoleOption(option =>
					option.setName('requiredrole')
						.setDescription('Required role')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('blockuser')
				.setDescription('Block a user from using Chiyo (Owner Only)')
				.addUserOption(option =>
					option.setName('target')
						.setDescription('User to block')
						.setRequired(true))
				.addBooleanOption(option =>
					option.setName('block')
						.setDescription('Whether to block or unblock the user')
						.setRequired(true))),
	async execute(interaction) {
		if (!isOwner(interaction.member, interaction.guild)) {
			interaction.reply('Only the guild owner can use this command');
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'requirerole': {
				const role = interaction.options.get('requiredrole').role;
				await updateOrInsertRole(interaction.client.db, interaction, role);
				interaction.reply(`Required role set to: ${role.name}`);
				break;
			}
			case 'blockuser': {
				const target = interaction.options.get('target');
				if (interaction.options.get('block').value) {
					await interaction.client.db.run(
						'INSERT OR IGNORE INTO blockedMembers VALUES (?, ?);',
						interaction.guildId, target.value,
					);
					await interaction.client.db.run(
						'INSERT OR IGNORE INTO blockedMembers VALUES (?, ?);',
						interaction.guildId, target.value,
					);
					interaction.reply(`${target.user.username} has been blocked from using Chiyo`);
				} else {
					await interaction.client.db.run(`
						DELETE FROM blockedMembers
						WHERE guild = ? AND user = ?;
						`, interaction.guildId, target.value,
					);
					interaction.reply(`${target.user.username} has been unblocked from using Chiyo`);
				}
				break;
			}
		}
	},
	allowedInGuilds: true,
	hasPerms,
};

async function hasPerms(db, member, guild) {
	// check if user is owner
	if (isOwner(member, guild)) {
		return true;
	}

	// check if user is blocked
	const isBlocked = (await db.get(`
		SELECT guild
		FROM blockedMembers
		WHERE guild = ? AND user = ?
		`, member.guild.id, member.id,
	)) != null;
	if (isBlocked) {
		return false;
	}

	// check if user has required role
	const requiredRoleRow = (await db.get(`
		SELECT requiredRole
		FROM requiredRoles
		WHERE guild = ?
		`, member.guild.id,
	));
	if (requiredRoleRow) {
		if (member.roles.cache.has(requiredRoleRow.requiredRole)) {
			console.log('user has role');
			return true;
		}
	} else {
		return true;
	}

	return false;
}

// check if a member is owner of the guild
function isOwner(member, guild) {
	return member.id == guild.ownerId;
}

async function updateOrInsertRole(db, interaction, role) {
	await db.run(
		'INSERT OR IGNORE INTO members VALUES (?, ?);',
		interaction.guildId, interaction.user.id,
	);
	// update requiredRole if it exists, else insert
	const roleExists = await db.get(`
		SELECT requiredRole
		FROM requiredRoles
		WHERE guild = ? AND requiredRole = ?;
		`, interaction.guildId, role.id,
	) != undefined;
	if (roleExists) {
		await db.run(`
			INSERT OR IGNORE INTO requiredRoles
			VALUES (?, ?);
			`, interaction.guildId, role.id,
		);
	} else {
		await db.run(`
			UPDATE requiredRoles
			SET requiredRole = ?
			WHERE guild = ?;
			`, role.id, interaction.guildId,
		);
	}
}