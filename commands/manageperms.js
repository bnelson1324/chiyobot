const { SlashCommandBuilder } = require('@discordjs/builders');
const insertOrIgnoreMember = require('../sql/utils').insertOrIgnoreMember;

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
			await interaction.reply('Only the guild owner can use this command');
			return;
		}

		switch (interaction.options.getSubcommand()) {
			case 'requirerole': {
				const role = interaction.options.get('requiredrole').role;
				await updateOrInsertRole(interaction, role);
				await interaction.reply(`Required role set to: ${role.name}`);
				break;
			}
			case 'blockuser': {
				const target = interaction.options.get('target');
				if (await isOwner(target.member, interaction.guild)) {
					await interaction.reply('Cannot use this command on guild owner');
					return;
				}
				const db = interaction.client.db;
				let replyText = target.user.tag;
				if (interaction.options.get('block').value) {
					await insertOrIgnoreMember(db, interaction.guildId, target.value);
					await db.run(
						'INSERT OR IGNORE INTO blockedMembers (guild, user) VALUES (?, ?);',
						interaction.guildId, target.value,
					);
					replyText += ' has been blocked from using Chiyo';
				} else {
					await db.run(`
						DELETE FROM blockedMembers
						WHERE guild = ? AND user = ?;
						`, interaction.guildId, target.value,
					);
					replyText += ' has been unblocked from using Chiyo';
				}
				await interaction.reply(replyText);
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
		`, guild.id, member.id,
	)) != null;
	if (isBlocked) {
		return false;
	}

	// check if user has required role
	const requiredRoleRow = (await db.get(`
		SELECT requiredRole
		FROM requiredRoles
		WHERE guild = ?
		`, guild.id,
	));
	if (requiredRoleRow) {
		return member.roles.cache.has(requiredRoleRow.requiredRole);
	} else {
		// if no required role set for the guild, return true
		return true;
	}
}

// check if a member is owner of the guild
function isOwner(member, guild) {
	return member.id === guild.ownerId;
}

async function updateOrInsertRole(interaction, role) {
	const db = interaction.client.db;
	// update requiredRole if it exists, else insert
	const roleExists = await db.get(`
		SELECT requiredRole
		FROM requiredRoles
		WHERE guild = ?;
		`, interaction.guildId,
	) != undefined;
	if (!roleExists) {
		await db.run(`
			INSERT OR IGNORE INTO requiredRoles (guild, requiredRole)
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