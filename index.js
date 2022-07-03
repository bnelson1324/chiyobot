const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// set up commands
client.commands = {};
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
commandFiles.forEach(file => {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
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

client.login(token);