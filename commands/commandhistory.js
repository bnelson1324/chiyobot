const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('commandhistory')
		.setDescription('See history of all commands used in the guild')
		.setDMPermission(false)
		.addIntegerOption(option =>
			option.setName('commandcount')
				.setDescription('Number of commands back to display')
				.setMinValue(1)
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('timezone')
				.setDescription('Offset from UTC timezone')
				.setMinValue(-12)
				.setMaxValue(14)
				.setRequired(false))
		.addBooleanOption(option =>
			option.setName('showid')
				.setDescription('Whether or not the response should show the IDs of users and roles')
				.setRequired(false)),
	async execute(interaction) {
		await interaction.deferReply();

		// get command history
		let timezoneOffset = interaction.options.get('timezone')?.value;
		if (!timezoneOffset) {
			timezoneOffset = 0;
		}
		const commandHistory = await interaction.client.db.all(`
			SELECT guildId,
				userId,
				DATETIME(timestamp, 'unixepoch', ? || ' hours') AS datetime,
				commandName,
				commandParameters
			FROM commandHistory
			WHERE guildId = ?
			ORDER BY timestamp DESC;
			`, timezoneOffset, interaction.guildId,
		);

		// format timezone
		let timezoneText = 'UTC';
		if (timezoneOffset >= 0) {
			timezoneText += `+${timezoneOffset}`;
		} else {
			timezoneText += `${timezoneOffset}`;
		}
		// format reply
		const historyMessages = [];
		let currCommandCount = 0;
		let lastCommandUserId;
		let historyText = `Command history in guild: **${interaction.guild.name}**\n\n`;
		for (const row of commandHistory) {
			// break if reaching over max command count
			if (currCommandCount >= interaction.options.get('commandcount').value) {
				break;
			}

			// split messages that go over the size limit
			const addStr = await formatCommandHistoryRow(row, interaction.client, timezoneText, lastCommandUserId, interaction.options.get('showid')?.value);
			if (historyText.length + addStr.length >= 2000) {
				historyMessages.push(historyText);
				historyText = '';

				// add userText if addStr starts w/ a tab (which means it is a command)
				if (addStr.charAt(0) === '\t') {
					historyText += `${await formatResource(interaction.client, row.guildId, 'USER', row.userId, interaction.options.get('showid')?.value)}\n`;
				}
			}

			// add addStr
			historyText += addStr;
			currCommandCount++;
			lastCommandUserId = row.userId;
		}
		if (historyText.length > 0) {
			historyMessages.push(historyText);
		}

		// send command history in DMs
		for (const msg of historyMessages) {
			await interaction.user.send(msg);
		}

		await interaction.editReply(`Sent command history: last ${currCommandCount} commands used`);
	},
	allowedInGuilds: true,
	addCommandInstance,
};

/* text formatting */
async function formatCommandHistoryRow(row, client, timezoneText, lastCommandUserId, showid) {
	const guild = await client.guilds.fetch(row.guildId);
	const member = await guild.members.fetch(row.userId);
	// if the same user uses more than 1 command in a row, display their name only once
	let chText = '';
	if (lastCommandUserId !== member.id) {
		chText += `${await formatResource(client, row.guildId, 'USER', row.userId, showid)}\n`;
	}

	// get command suboptions as string
	let suboptStr = '';
	for (const [paramName, paramData] of Object.entries(JSON.parse(row.commandParameters))) {
		suboptStr += `${paramName}: ${await formatResource(client, row.guildId, paramData.type, paramData.value, showid)}, `;
	}

	// display command, params, and time
	chText += `\t\t**/${row.commandName}**\t${suboptStr}\n`;
	chText += `\t\t\t\t${row.datetime} ${timezoneText}\n`;

	return chText;
}

// return a string to represent a resource in a guild
async function formatResource(client, guildId, type, value, showId) {
	const guild = await client.guilds.fetch(guildId);
	switch (type) {
		case 'USER': {
			const member = await guild.members.fetch(value);
			let str = `**${member.user.tag}**`;
			if (showId) {
				str += ` (ID: ${member.id})`;
			}
			return str;
		}
		case 'ROLE': {
			const role = await guild.roles.fetch(value);
			let str = `${role.name}`;
			if (showId) {
				str += ` (ID: ${role.id})`;
			}
			return str;
		}
		default: {
			return value;
		}
	}
}

/* misc */
// add the use of a command to commandHistory in the db
async function addCommandInstance(interaction) {
	// get command name, with subcommand
	let commandName = interaction.commandName;
	const subCommandName = interaction.options._subcommand;
	if (subCommandName) {
		commandName += ` ${subCommandName}`;
	}

	// get parameters of command
	const commandOptions = {};
	for (const opt of interaction.options._hoistedOptions) {
		commandOptions[opt.name] = {
			type: opt.type,
			value: opt.value,
		};
	}

	// insert into db
	await interaction.client.db.run(`
		INSERT INTO commandHistory (guildId, userId, timestamp, commandName, commandParameters)
		VALUES (?, ?, UNIXEPOCH(), ?, ?);
	`, interaction.guildId, interaction.user.id, commandName, JSON.stringify(commandOptions));
}