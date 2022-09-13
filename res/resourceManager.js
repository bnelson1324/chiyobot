const fs = require('node:fs');
const path = require('node:path');

// get file paths from speechBubbles folder
let speechBubbles;
try {
	speechBubbles = fs.readdirSync('res/speechBubbles').map(file => path.join('res/speechBubbles', file));
} catch (err) {
	if (err.code == 'ENOENT') {
		console.log('Could not find speech bubbles directory');
	} else {
		console.error(err);
	}
}

// methods to get the path to certain resources
module.exports = {
	getPenguinImage,
	getRandSpeechBubble,
};

function getPenguinImage() {
	return 'res/penguin.png';
}

// return a random speech bubble image, or if there are none, return penguin image
function getRandSpeechBubble() {
	if (speechBubbles == null || speechBubbles.length == 0) { return getPenguinImage(); }
	return speechBubbles[Math.floor(Math.random() * speechBubbles.length)];
}