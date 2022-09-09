const fs = require('node:fs');
const path = require('node:path');

const speechBubbles = fs.readdirSync('res/speechBubbles').map(file => path.join('res/speechBubbles', file));

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
	if (speechBubbles.length == 0) { return getPenguinImage(); }
	return speechBubbles[Math.floor(Math.random() * speechBubbles.length)];
}