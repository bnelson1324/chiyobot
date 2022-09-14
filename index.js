const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const perms = require('./commands/manageperms');
const commandHistory = require('./commands/commandhistory');
const resourceManager = require('./res/resourceManager');
const insertOrIgnoreMember = require('./sql/utils').insertOrIgnoreMember;

(async () => {
	// set up database
	client.db = await open({
		filename: path.join(__dirname, 'database.sqlite'),
		driver: sqlite3.Database,
	});
	const schema = fs.readFileSync(path.join(__dirname, 'sql/schema.sql'), 'utf8');
	await client.db.exec(schema);
	console.log('Database loaded');

	// set up commands
	client.commands = {};
	const commandsPath = path.join(__dirname, 'commands');
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	commandFiles.forEach(file => {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if (command.setup) {
			command.setup(client);
		}
		client.commands[command.data.name] = command;
	});

	client.once('ready', () => {
		console.log('Ready');
	});

	// handle commands
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) {
			return;
		}

		// check if command doesn't exist
		const command = client.commands[interaction.commandName];
		if (!command) {
			return;
		}
		// check if member is in a guild and doesn't have perms
		if (interaction.guild != null && !(await perms.hasPerms(client.db, interaction.member, interaction.guild))) {
			await interaction.reply({ files: [resourceManager.getRandSpeechBubble()] });
			return;
		}

		// execute command
		try {
			const inGuild = interaction.guild != null;
			if (!inGuild || (inGuild && command.allowedInGuilds)) {
				// add command user to database
				await insertOrIgnoreMember(interaction.client.db, interaction.guildId, interaction.user.id);

				// execute command
				await command.execute(interaction);

				// log command in commandHistory
				await commandHistory.addCommandInstance(interaction);
			} else {
				await interaction.reply('Must use this command in DMs');
			}
		} catch (error) {
			console.error(error);
			if (!interaction.replied) {
				await interaction.reply({ content: 'There was an error executing this command', ephermal: true });
			}
		}
	});

	// login
	client.login(token);
})();