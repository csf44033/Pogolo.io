var _ = require("lodash");
var Graphics = require("./graphics");
var Backend = require("./multiplayer");

//var { updatedDiff } = require("deep-object-diff");

window.game = {
	gfx: new Graphics(),
	multi: new Backend(),
	inited: null,
	color: 0,
	input: {
		mouse: 0
	},
	lastInput: {
		mouse: 0
	},
	lastSend: Date.now()
};

//handle messages
game.multi.on("message", data => {
	game.gfx.handleData(data);
});

//when the server opens
game.multi.on("open", () => {
	game.gfx.addTick(() => {
		if (!game.multi.open) return;
		game.gfx.run();
		if (game.gfx.scene !== 'game') return;
		
		if (
			JSON.stringify(game.input) !== JSON.stringify(game.lastInput) ||
			Date.now() - game.lastSend > 1000
		) {
			game.multi.send("input", game.input);
			game.lastInput = _.cloneDeep(game.input);
			game.lastSend = Date.now();
		}
	});

	const colors = game.gfx.colors;
	const colorselect = document.getElementById("color-select");
	var s = 150/6;
	for(let i = 6; i --;){
		let color = colors[i][0];
		const div = document.createElement("DIV");
		div.className = "color";
		div.style.borderLeft = s*(i+1)+"px solid #"+color;
		div.style.borderBottom = s*(i+1)+"px solid transparent";
		colorselect.appendChild(div);
	}
});

document.body.appendChild(game.gfx.getView());

//update mouse position
window.addEventListener("mousemove", e => {
	var orientation = Math.round(Math.atan2(
		e.clientY - window.innerHeight / 2,
		e.clientX - window.innerWidth / 2
	)*180/Math.PI);
	game.input.mouse = orientation;
	game.gfx.orientation = orientation
});

//update touch position
window.addEventListener("touchmove", e => {
	e.preventDefault();
	var touch = e.changedTouches[0];
	var orientation = Math.round(Math.atan2(
		touch.pageY - window.innerHeight / 2,
		touch.pageX - window.innerWidth / 2
	)*180/Math.PI);
	game.input.mouse = orientation;
	game.gfx.orientation = orientation
});

//check for play button pressed
document.getElementById("play-button").addEventListener("click", e => {
	if(!game.multi.open) return;//don't run if not connected to server
	var name = document.getElementById("player-name").value;

	//send join with name and color type
	game.multi.send("join", {
		name: name,
		type: 1
	});
});