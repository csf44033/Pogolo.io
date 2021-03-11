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
	/*"catch_objects",
	"catch_scores"*/
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
const PLAYERS = {};
var past_date = 0;
var current_date = 0;
module.exports = class {
	constructor() {
		this.scene = "menu";
		this._tickFuncs = [];
		this.view = 600;
		this.running = true;
		this.PID = null;
		this.players = {};
		this.objects = [];
		this.pucks = [];
		this.popups = [];
		this.colors = COLORS
		this.titlePage = {
			tiles:[],
			pogolos:[],
			pucks:[]
		};
		this.app = new PIXI.Application({
			antialias: true
		});
		this.mat = new PIXI.Matrix();

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
		graphics.clear();
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
		graphics.clear();
		var objects = this.objects;
		for(var i = 0; i < objects.length; i +=3){
			graphics.lineStyle(5, "0xFFFFFF", 1, 0.5);
			graphics.drawCircle(objects[i], objects[i+1], objects[i+2]);
		}
		var popups = this.popups;
		for(let i = popups.length; i --;){
			let p = popups[i];
			const dude = p[0];
			let t = p[1];
			let life = p[2];
			let y = p[3];
			dude.y = y + 0.25*t*t - 10*t;
			p[1] ++;
			if(t>life){		//Jacob wuz here
				this.app.stage.removeChild(dude);
				this.popups.splice(i,1);
			}
		}

		PLAYERS[this.PID].pogolo.rotation = this.orientation/RAD;
		Object.values(PLAYERS).forEach(player=>{
			var theta = player.angle/RAD;
			var vx = Math.cos(theta)*elapsed*2;
			var vy = Math.sin(theta)*elapsed*2;
			player.pogolo.x += vx;
			player.pogolo.y += vy;
		});
		Object.values(this.pucks).forEach(puck=>{
			var theta = puck.angle/RAD;
			var vx = Math.cos(theta)*elapsed*2.5;
			var vy = Math.sin(theta)*elapsed*2.5;
			puck.puck.x += vx;
			puck.puck.y += vy;
		});
		this.app.stage.pivot.set(PLAYERS[this.PID].pogolo.x,PLAYERS[this.PID].pogolo.y);
	}
	run(){
		current_date = Date.now()
		this[this.scene]((current_date-past_date)*6/100);
		past_date = current_date
	}
	showTiles(visible){
		for(var i = 0; i < this.titlePage.tiles.length; i ++){
			this.titlePage.tiles[i].visible = visible;
		}
	}
	handleData(data){
		graphics.clear();
		this[EVENTS[data.type]](data.data)
	}
	catch_state(e){
		graphics.clear();
		var objects = this.objects;
		for(var i = 0; i < objects.length; i +=3){
			graphics.lineStyle(5, "0xFFFFFF", 1, 0.5);
			graphics.drawCircle(objects[i], objects[i+1], objects[i+2]);
		}
		var PID = this.PID;
		var players = e[0];
		var pucks = e[1];
		var index = players.indexOf(PID);
		this.app.stage.pivot.set(players[index+1],players[index+2]);
		/*[id,x,y,oriantation,angle,//speed]*/
		for(var i = 0; i < players.length; i += 5){
			var id = players[i];
			if(PLAYERS[id] === void 0) continue;
			PLAYERS[id].pogolo.x = players[i+1];
			PLAYERS[id].pogolo.y = players[i+2];
			if(id!==PID) PLAYERS[id].pogolo.rotation = players[i+3]*Math.PI/180;
			PLAYERS[id].angle = players[i+4];
			/*PLAYERS[id].speed = player[5];*/
			PLAYERS[id].pogolo.visible = true;
		}
		for(var i = 0; i < pucks.length; i += 3){
			var id = i/3;
			this.pucks[id].puck.x = pucks[i];
			this.pucks[id].puck.y = pucks[i+1];
			this.pucks[id].angle = pucks[i+2];
			this.pucks[id].puck.visible = true;
		}
	}
	/*
	catch_objects(e){
		var players = e.players;
		var balls = e.balls;
		var pos = e.pos;
		var y = 0;
		this.x = pos[0];
		this.y = pos[1];
		for(var i = 0, N = players.length; i < N; i += 4){
			const pogolo = this.players[players[i]].pogolo;
			pogolo.x = players[i+1];
			pogolo.y = players[i+2];
			pogolo.rotation = players[i+3]/180; 
		}
		for(var i = 0, N = balls.length; i < N; i += 3){
			const puck = this.pucks[balls[i+2]];
			puck.x = balls[i];
			puck.y = balls[i+1];
		}
		if(e.kills){
			var kills = e.kills;
			console.log("list of kills=>", kills)
			for(var i = 0, N = kills.length; i < N; i ++){
				this.addPopUp("You Killied "+kills[i]+"!", 100, y);
				y+=50;
			}
		}
		if(e.score){
			this.addPopUp("+"+e.score, 100, y);
		}
		graphics.lineStyle(5, 0xFFFFFF, 1, 0.5);
		graphics.drawCircle(pos[0], pos[1], 400);
	};//draw objects
*/
	catch_init(e){
		var players = e[0];
		this.objects = e[1];
		for(var i = 0; i < e[2]; i ++){
			this.addPuck();
		}

		console.log("Init", players[0])
		this.showTiles(false);
		this.update_scene("game");
		var id = players[0];
		var name = players[1];
		var type = players[2];
		this.PID = id;
		this.name = name;
		this.type = type;

		var pogolo = new Pogolo(type);
		this.app.stage.addChild(pogolo);
		PLAYERS[id] = {id, name, type, pogolo, angle:0};

		for(var i = 3; i < players.length; i += 3){
			this.catch_player([players[i], players[i+1], players[i+2]]);
		}
	};//init player

	catch_player(e){
		var id = e[0];
		var name = e[1];
		var type = e[2];

		console.log("Added Player", id, "Name", name, "Type", type)
		var pogolo = new Pogolo(type);
		pogolo.visible = false;

		this.app.stage.addChild(pogolo);
		PLAYERS[id] = {id, name, type, pogolo, angle:0};
	};//add player

	remove_player(e){
		console.log("Removed Player ID:", e);
		if(e === this.PID){
			this.showTiles(true);
			this.update_scene("menu")
			Object.values(PLAYERS).forEach(player=>{
				var id = player.id
				this.app.stage.removeChild(PLAYERS[id].pogolo);
				delete PLAYERS[id];
			});
			console.log("You Died");
		}else{
			this.app.stage.removeChild(PLAYERS[e].pogolo);
			delete PLAYERS[e];
		}
	};//delete player

	catch_scores(e){
		let playerlist = document.getElementById("playerlist");
		let listItem = playerlist.getElementsByTagName("li");
		for(let i = 0, N = listItem.length; i < N; i ++){
			if(e[i] === void 0){
				listItem[i].style.display = "none";
			}else{
				listItem[i].style.display = "list-item";
				var player = this.players[e[i].id]
				var c = COLORS[player.type][0];
				listItem[i].innerHTML = player.name+` <span style='box-shadow:0 0 10px 5px #${c};background-color:#${c};margin:5px;'>${e[i].score}</span>`;
			}
		}
	};//update score
	update_scene(scene){
		document.getElementById(this.scene).style.display = "none";
		document.getElementById(scene).style.display = "flex";
		this.scene = scene
	}
	addPuck(){
		const puck = new Puck();
		puck.visible = false;

		this.app.stage.addChild(puck);
		this.pucks.push({puck,angle:0});
	}
	addPopUp (message, life, y){
		var basicText = new PIXI.Text(message,textStyle);
		basicText.x = 0;
		basicText.y = y;
		this.app.stage.addChild(basicText);
		this.popups.push([basicText, 0, life, y]);
	}
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