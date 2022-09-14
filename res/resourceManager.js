const fs = require('node:fs');
const path = require('node:path');

// get file paths from speechBubbles folder
let speechBubbles;
try {
	const speechBubblesDir = path.join(__dirname, 'speechBubbles');
	speechBubbles = fs.readdirSync(speechBubblesDir).map(file => path.join(speechBubblesDir, file));
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
	return path.join(__dirname, 'penguin.png');
}

// return a random speech bubble image, or if there are none, return penguin image
function getRandSpeechBubble() {
	if (speechBubbles == null || speechBubbles.length == 0) { return getPenguinImage(); }
	return speechBubbles[Math.floor(Math.random() * speechBubbles.length)];
}