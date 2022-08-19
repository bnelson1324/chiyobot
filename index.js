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
client.getModel = function(modelName) {
	return this.sequelize.models[modelName];
};

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

// sync all database models
client.sequelize.sync();

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
		if (interaction.guild) {
			await command.execute(interaction);
		} else {
			interaction.reply('Cannot use commands outside of a server');
		}
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error executing this command', ephermal: true });
	}
});

// login
client.login(token);