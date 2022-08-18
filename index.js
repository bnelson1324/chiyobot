const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const Sequelize = require('sequelize');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

// set up database
client.sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: 'database.sqlite',
	logging: false,
});

// set up commands
client.data = {};
client.commands = {};
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
commandFiles.forEach(file => {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands[command.data.name] = command;
	if (command.setup) {
		command.setup(client);
	}
});

client.once('ready', () => {
	console.log('Ready');
});

// handle commands
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) {
		return;
	}

	const command = client.commands[interaction.commandName];

	if (!command) {
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error executing this command', ephermal: true });
	}
});

// log in
client.login(token);