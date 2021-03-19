//Task: interperate server info to graphics


//npx webpack (to load app)
//npx http-server client index.html (to launch local host)
//cd server //node index

const COLORS = [
	["FF0000","640000"],
	["FF6900","643200"],
	["FFFF00","646400"],
	["00FF00","006400"],
	["0000FF","000064"],
	["6900FF","320064"],
	["FFFFFF","646464"]
];
const EVENTS = [
	"catch_state",
	"catch_player",
	"catch_init",
	"remove_player"
];
const textStyle = {
	font : 'bold italic Arial',
	fontSize:50,
    fill: '#FFFFFF',
    stroke: '#00FFFF',
    strokeThickness: 5,
    dropShadow: false
};

const PI = Math.PI;
const tau = Math.PI * 2;
const RAD = 180/PI;
const PIXI = require("pixi.js");
const graphics = new PIXI.Graphics();

const Pogolo = class {
	constructor(type){
		this.base = new PIXI.Container();
		this.circ = PIXI.Sprite.from("sprites/circle.png");
		this.circ.scale.set(4/15);
		this.circ.anchor.set(0.5, 0.5);
		this.arc = PIXI.Sprite.from("sprites/arc.png");
		this.arc.scale.set(4/15);
		this.arc.anchor.set(0.5, 0.5);
		this.circ.tint = "0x"+COLORS[type][0];
		this.base.addChild(this.arc, this.circ);
		return this.base;
	}
};
const Puck = class {
	constructor(){
		this.puck = PIXI.Sprite.from("sprites/puck.png");
		this.puck.scale.set(4/15);
		this.puck.anchor.set(0.5, 0.5);
		return this.puck;
	}
};
const Tile = class {
	constructor(){
		this.tile = PIXI.Sprite.from("sprites/tile.png");
		this.tile.scale.set(4/15);
		this.tile.anchor.set(0.5,0.5);
		return this.tile;
	}
};

function update_object_position (dictt, elapsed) {
	Object.values(dictt).forEach(obj => {

		// variables
		var theta = obj.angle/RAD;
		var speed = obj.speed;

		// update object position
		obj.echo.x += Math.cos(theta)*elapsed*speed;
		obj.echo.y += Math.sin(theta)*elapsed*speed;
		//((a - test + PI) % TAU + TAU) % TAU - PI
		var orientation = obj.orientation/RAD;
		var shortest = ((orientation - obj.echo.rotation + PI) % tau + tau) % tau - PI;
		obj.echo.rotation += elapsed*shortest/4;
	});
};
function write_object (read, write){
	Object.values(read).forEach(dictt=>{
		var loc = dictt.key;
		delete dictt.key;

		Object.entries(dictt).forEach(([key0, value0]) => {
			if (typeof value0 === 'object') {
				Object.entries(value0).forEach(([key1, value1]) => {
					write[loc][key0][key1] = value1;
				});
			}else{
				write[loc][key0] = value0;
			}
		});
	});
};
const PLAYERS = {};
var past_date = 0;
var current_date = 0;

module.exports = class {
	constructor() {
		// basic variables
		this.scene = "menu";
		this.view = 600;
		this.running = true;
		this.PID = null;

		// lists
		this._tickFuncs = [];
		this.objects = [];
		this.pucks = [];
		this.popups = [];
		this.colors = COLORS;

		// dictionaries
		this.players = {};
		this.titlePage = {
			tiles:[],
			pogolos:[],
			pucks:[]
		};

		// objects
		this.app = new PIXI.Application({
			antialias: true
		});

		// init
		window.requestAnimationFrame(this.tick.bind(this));
		window.addEventListener("resize", this.resize.bind(this));
		this.resize();

		for(let i = 0; i < 10; i ++){
			var x = 240*Math.floor((Math.random()*1000-500)/240);
			var y = 120*Math.floor((Math.random()*1000-500)/120)+60;
			for(let j = this.titlePage.tiles.length; j --;){
				var t = this.titlePage.tiles[j]
				if((t.x === x) && (t.y === y)){
					x = 240*Math.floor((Math.random()*1000-500)/240);
					y = 120*Math.floor((Math.random()*1000-500)/120)+60;
					j = this.titlePage.tiles.length;
					continue;
				}
			}
			const tile = new Tile();
			tile.x = x;
			tile.y = y;
			this.app.stage.addChild(tile);
			this.titlePage.tiles.push(tile);
		}
		for(let i = 0; i < 5; i ++){
			var x = 120*Math.floor((Math.random()*1000-500)/120);
			var y = 120*Math.floor((Math.random()*1000-500)/120);
			for(let j = this.titlePage.pogolos.length; j --;){
				var t = this.titlePage.pogolos[j]
				if((t.x === x) && (t.y === y)){
					x = 120*Math.floor((Math.random()*1000-500)/120);
					y = 120*Math.floor((Math.random()*1000-500)/120);
					j = this.titlePage.pogolos.length;
					continue;
				}
			}
			this.titlePage.pogolos.push({
				x:x,
				y:y,
				a:Math.random()*tau,
				c:Math.floor(Math.random()*(COLORS.length-1))
			});
		}
		for(let i = 0; i < 3; i ++){
			var x = 120*Math.floor((Math.random()*1000-500)/120);
			var y = 120*Math.floor((Math.random()*1000-500)/120);
			var c = this.titlePage.pucks.concat(this.titlePage.pogolos);
			for(let j = c.length; j --;){
				var t = c[j]
				if((t.x === x) && (t.y === y)){
					x = 120*Math.floor((Math.random()*1000-500)/120);
					y = 120*Math.floor((Math.random()*1000-500)/120);
					j = c.length;
					continue;
				}
			}
			this.titlePage.pucks.push({x:x,y:y});
		}
		this.app.stage.addChild(graphics);
	}
	menu(){
		var menuObjects = this.titlePage;
		var tiles = menuObjects.tiles;
		var pogolos = menuObjects.pogolos;
		var pucks = menuObjects.pucks;

		for(let i = tiles.length; i --;){
			const tile = tiles[i];
			tile.x --;
			if(tile.x < -720){
				var y = 120*Math.floor((Math.random()*1000-500)/120)+60;
				for(let j = tiles.length; j --;){
					const t = tiles[j];
					if(t.x === 720 && t.y === y){
						y = 120*Math.floor((Math.random()*1000-500)/120)+60;
						j = tiles.length;
						continue;
					}
				}
				tile.x = 720;
				tile.y = y;
			}
		}
		var p = 1.02;
		for(let i = pogolos.length; i --;){
			const pogolo = pogolos[i];
			var x = pogolo.x;
			var y = pogolo.y;
			var a = pogolo.a;
			var s = a-tau/15;
			var e = a+tau/15;
			var c = COLORS[pogolo.c];
			graphics.lineStyle(10, "0x"+c[1], 1, 0.5);
			graphics.drawCircle(x, y, 50);

			graphics.lineStyle(10, 0x646464, 1, 0.5);
			graphics.moveTo(x+Math.cos(s)*70, y+Math.sin(s)*70);
			graphics.arc(x,y,70,s,e);

			graphics.lineStyle(0);
			graphics.beginFill(0x646464);
			graphics.drawCircle(x+Math.cos(s)*70, y+Math.sin(s)*70,5);
			graphics.drawCircle(x+Math.cos(e)*70, y+Math.sin(e)*70,5);
			graphics.endFill();

			graphics.lineStyle(10*p, "0x"+c[0], 1, 0.5);
			graphics.drawCircle(x*p, y*p, 50*p);

			graphics.lineStyle(10*p, 0xFFFFFF, 1, 0.5);
			graphics.moveTo((x+Math.cos(s)*70)*p, (y+Math.sin(s)*70)*p);
			graphics.arc(x*p,y*p,70*p,s,e);
			graphics.lineStyle(0);
			graphics.beginFill(0xFFFFFF);
			graphics.drawCircle((x+Math.cos(s)*70)*p, (y+Math.sin(s)*70)*p,5*p);
			graphics.drawCircle((x+Math.cos(e)*70)*p, (y+Math.sin(e)*70)*p,5*p);
			graphics.endFill();
			pogolo.x --;
			if(pogolo.x < -600){
				var y = 120*Math.floor((Math.random()*1000-500)/120);
				var c = pucks.concat(pogolos);
				for(let j = c.length; j --;){
					const t = c[j];
					if(t.x === 600 && t.y === y){
						y = 120*Math.floor((Math.random()*1000-500)/120);
						j = c.length;
						continue;
					}
				}
				pogolo.x = 600;
				pogolo.y = y;
				pogolo.r = Math.random()*tau;
				pogolo.c = Math.floor(Math.random()*(COLORS.length-1));
			}
		}
		for(let i = pucks.length; i --;){
			const puck = pucks[i];
			var x = puck.x;
			var y = puck.y;
			graphics.lineStyle(10, 0x646464, 1, 0.5);
			graphics.drawCircle(x, y, 25);
			graphics.lineStyle(10*p, 0xFFFFFF, 1, 0.5);
			graphics.drawCircle(x*p, y*p, 25*p);
			puck.x --;
			if(puck.x < -600){
				var y = 120*Math.floor((Math.random()*1000-500)/120);
				var c = pucks.concat(pogolos);
				for(let j = c.length; j --;){
					const t = c[j];
					if(t.x === 600 && t.y === y){
						y = 120*Math.floor((Math.random()*1000-500)/120);
						j = c.length;
						continue;
					}
				}
				puck.x = 600;
				puck.y = y;
			}
		}
	}
	game(elapsed){
		var objects = this.objects;
		for(var i = 0; i < objects.length; i +=3){
			graphics.lineStyle(5, "0xFFFFFF", 1, 0.5);
			graphics.drawCircle(objects[i], objects[i+1], objects[i+2]);
		}

		update_object_position(PLAYERS, elapsed);
		update_object_position(this.pucks, elapsed);

		var PID = this.PID
		PLAYERS[PID].echo.rotation = this.orientation/RAD;
		this.app.stage.pivot.set(PLAYERS[PID].echo.x,  PLAYERS[PID].echo.y);
	}
	run(){
		graphics.clear();
		past_date = current_date;
		current_date = Date.now();
		this[this.scene](6*(current_date-past_date)/100);
	}
	showTiles(visible){
		for(var i = 0; i < this.titlePage.tiles.length; i ++){
			this.titlePage.tiles[i].visible = visible;
		}
	}
	handleData(data){
		
		try {
			this[EVENTS[data.type]](data.data);
		} catch (err){
			console.log("Data was not run:", err);
		}
	}

	catch_state(e){
		write_object(e[0], PLAYERS);
		write_object(e[1], this.pucks);
		var PID = this.PID;
		this.app.stage.pivot.set(PLAYERS[PID].echo.x,  PLAYERS[PID].echo.y);
	}

	catch_init(e){

		// log event  
		console.log("Init:", e);
		this.showTiles(false);
		this.update_scene("game");

		// variables
		var players = e[0];
		this.PID = players[0];

		// catch objects
		this.objects = e[1];

		// catch pucks
		for(var i = 0; i < e[2]; i ++){
			this.addPuck();
		}

		// catch pogolos
		for(var i = 0; i < players.length; i += 3){
			this.catch_player([players[i], players[i+1], players[i+2]]);
		}
	};

	catch_player(e){

		// log event
		console.log("Added Player:", e)

		// variables
		var id = e[0];
		var name = e[1];
		var type = e[2];
		var echo = new Pogolo(type);

		// add pogolo to stage
		this.app.stage.addChild(echo);

		// catch player
		PLAYERS[id] = {id, name, type, echo, orientation:0, speed:2, score:0, angle:0};

	};

	remove_player(e){

		// log event
		console.log("Removed Player ID:", e);

		//variables
		var id = e[0];

		// if your pogolo was removed
		if(id === this.PID){

			// action complete
			console.log("You Died");
			this.showTiles(true);
			this.update_scene("menu");

			// clear objects
			Object.keys(PLAYERS).forEach(e=>{this.remove_echo(PLAYERS, e);});
			for(var i = this.pucks.length; i --;){
				this.app.stage.removeChild(this.pucks[i].echo);
				this.pucks.splice(i, 1);
			}
			this.objects = [];
		}else{
			if(e[1] && e[1] === this.PID){
				// you killed player at id
				var node = document.createElement("DIV");
				node.className = "killed row";
				node.innerHTML = "<div><img src = 'sprites/killed.png' width='25px' height='25px'></div>"+
								 `<div class = 'fit' style = 'padding:0px 10px;'>Killed: ${PLAYERS[id].name}</div>`;
				var parent = document.getElementById("kill_chart");
				parent.appendChild(node);
				setTimeout(()=>{
					node.style.opacity = 0;
					node.addEventListener('transitionend', () => node.remove());
				}, 5000);
			}
			this.remove_echo(PLAYERS, id);
		}
	};

	update_scene(scene){
		document.getElementById(this.scene).style.display = "none";
		document.getElementById(scene).style.display = "flex";
		this.scene = scene
	};

	addPuck(){

		// variable
		var echo = new Puck();

		// add puck to stage
		this.app.stage.addChild(echo);

		// catch puck
		this.pucks.push({echo, orientation:0, speed:2.5, angle:0});
	};

	remove_echo (dictt, key){
		this.app.stage.removeChild(dictt[key].echo);
		delete dictt[key];
	};

	addTick(f) {
		this._tickFuncs.push(f);
	}
	tick() {
		if (!this.running) return;

		this._tickFuncs.forEach(t => {
			typeof t == "function" && t();
		});

		window.requestAnimationFrame(this.tick.bind(this));
	}
	getView() {
		return this.app.view;
	}
	resize() {
		let dx = window.innerWidth;
		let dy = window.innerHeight;
		let radius = Math.sqrt(dx*dx + dy*dy)/2;
		let scale = radius/this.view;

		this.app.renderer.resize(dx, dy);
		this.app.stage.position.set(dx/2, dy/2);
		this.app.stage.scale.set(scale);
	}
};