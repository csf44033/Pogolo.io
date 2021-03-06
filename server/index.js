const PI = Math.PI;
const TAU = PI*2;
const RAD = PI/180
var past_date = 0;
var current_date = 0;

const WebSocket = require("ws");
const { decode, encode } = require("@msgpack/msgpack");
const rand = temp => {
	const letter = () => {
		var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		return chars.charAt(Math.floor(Math.random() * chars.length));
	};
	const number = () => {
		var chars = "0123456789";

		return chars.charAt(Math.floor(Math.random() * chars.length));
	};
	const char = () => {
		var chars =
			"0123456789" +
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

		return chars.charAt(Math.floor(Math.random() * chars.length));
	};
	return temp
		.split("")
		.map(t => {
			return t
				.replace(/C/g, char())
				.replace(/X/g, letter())
				.replace(/0/g, number());
		})
		.join("");
};
const _ = require("lodash");

function sign (x) {
	return x<0?-1:1;
};
function round (a, b){
	return Math.round(a*b)/b;
};

function isAngleBetween(test, a, b) {
    var a_adjust = ((a - test + PI) % TAU + TAU) % TAU - PI;
    var b_adjust = ((b - test + PI) % TAU + TAU) % TAU - PI;
    return (a_adjust*b_adjust < 0) && (Math.abs(a_adjust - b_adjust) < PI);
};

function Body (x, y, speed, mass){

    this.x = x;
    this.y = y;
	this.speed = speed
    this.mass = mass;

    this.inverseMass = (mass === 0 || mass === void 0) ? 0 : 1/mass;

	this.updateAngle(Math.random()*TAU, 4)
};
Body.prototype.updateVelocity = function(dt){
	var speed = this.speed;
	var angle = this.angle*RAD;
    this.vx = Math.cos(angle)*speed*dt;
	this.vy = Math.sin(angle)*speed*dt;
}
Body.prototype.updateAngle = function(angle){
	this.angle = round(angle/RAD, 1);
	this.collide = {hit: false, nx: 1, ny: 0};
};
Body.prototype.bang = function(remove, nx, ny){
	this.vx += remove*nx;
	this.vy += remove*ny;
	this.collide = {
		hit: true,
		nx: nx,
		ny: ny
	}
}
Body.prototype.updatePosition = function(){
    this.x += this.vx;
    this.y += this.vy;
};

function Circle (x, y, radius, speed, mass){
    Body.call(this, x, y, speed, mass);
    this.radius = radius;
};
Circle.prototype = Object.create(Body.prototype);
Circle.prototype.getContact = function(body) {
    if (body instanceof Circle) {
        var dx = body.x - this.x;
        var dy = body.y - this.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        dx /= distance;
        dy /= distance;
        distance -= this.radius + body.radius;
        return {
            distance: distance,
            normalX: dx,
            normalY: dy
        };
    }
};

function Arc (x, y, radius, speed, strokeWeight, start, end, mass){
    Body.call(this, x, y, speed, mass);
    this.strokeWeight = strokeWeight;
    this.radius = radius;
    this.start = start;
    this.end = end;
}
Arc.prototype = Object.create(Body.prototype);
Arc.prototype.getContact = function(body) {
    if(body instanceof Circle){
        var sa = this.start;
        var ea = this.end;
        var dx = body.x - this.x;
        var dy = body.y - this.y;
        var ma = Math.atan2(dy,dx);
		var contacts = [];
        if(isAngleBetween(ma,sa,ea)){
            var distance = Math.sqrt(dx*dx + dy*dy);
            dx/=distance;
            dy/=distance;
            distance-=this.radius;
            var s = sign(distance);
            contacts.push({
                distance: distance*s-body.radius-this.strokeWeight,
                normalX: s*dx,
                normalY: s*dy
            });
			return contacts
        }
        var dx1 = dx - Math.cos(sa)*this.radius;
        var dy1 = dy - Math.sin(sa)*this.radius;
        var distance = Math.sqrt(dx1*dx1 + dy1*dy1);
		dx1/=distance;
		dy1/=distance;
		contacts.push({
            distance: distance - this.strokeWeight - body.radius,
            normalX: dx1,
            normalY: dy1
        })
        dx1 = dx - Math.cos(ea)*this.radius;
        dy1 = dy - Math.sin(ea)*this.radius;
        distance = Math.sqrt(dx1*dx1 + dy1*dy1);
		dx1/=distance;
		dy1/=distance;
		contacts.push({
            distance: distance - this.strokeWeight - body.radius,
            normalX: dx1,
            normalY: dy1
        })
        return contacts
    }
};

function inverseCircle (x, y, radius, speed, mass){
    Body.call(this, x, y, speed, mass);
    this.radius = radius;
};
inverseCircle.prototype = Object.create(Body.prototype);
inverseCircle.prototype.getContact = function(body) {
    if(body instanceof Circle){
        var dx = body.x - this.x;
        var dy = body.y - this.y;
        var distance = -Math.sqrt(dx*dx + dy*dy);
        dx/=distance;
        dy/=distance;
        distance += this.radius - body.radius;
        return {
            distance: distance,
            normalX: dx,
            normalY: dy
        };
    }
};

function Player (name, id, type, speed) {
	var distance = Math.random()*195 + 152.5;
	var angle = Math.floor(Math.random()*360);
	var x = Math.cos(angle)*distance;
	var y = Math.sin(angle)*distance;

	Body.call(this, x, y, speed, 1);
	this.body = new Circle(x, y, 52.5, 0, 0);
	this.vanguard = new Arc(x, y, 62.5, 0, 2.5, -TAU/15, TAU/15, 0);

	this.name = name;
	this.id = id;
	this.type = type;

	this.orientation = 0;
	this.score = 0;
};
Player.prototype = Object.create(Body.prototype);
Player.prototype.updatePosition = function(){
	this.x += this.vx;
	this.y += this.vy;
	this.vanguard.x = this.body.x = this.x;
	this.vanguard.y = this.body.y = this.y;
};
Player.prototype.aim = function(angle) {
	this.orientation = angle;
	angle*=RAD
	var v = this.vanguard;
	v.start = angle - TAU/15;
	v.end = angle + TAU/15;
};

//2.5 speed
function Puck (x,y){
	Circle.call(this, x, y, 22.5, 2.5, 1);
	this.angle = round(Math.random()*360,1);

	this.sentBy = void 0;
}
Puck.prototype = Object.create(Circle.prototype);

function obj_list (key, dict, optional=[]) {
	var obj = {
		key: key,
		angle: dict.angle,
		echo: {
			x: round(dict.x, 10),
			y: round(dict.y, 10)
		}
	}
	Object.values(optional).forEach(option=>{
		obj[option] = dict[option];
	});
	return obj;
};

const Game = class {
	constructor() {
		//Game Data
		this.size = 600;

		this.objects = [];
		this.pucks = [];
		//create default map (radius[400]-stroke[])
		this.objects.push(new inverseCircle(0,0,397.5,0))//400-stroke
		
		for(var i = 0; i < 3; i ++){
			var r = 22.5;
			var a = Math.random()*TAU;
			var l = Math.random()*(400-r-120);
			this.pucks.push(new Puck(Math.cos(a)*l,Math.sin(a)*l));
		}

		this.clients = {};//stores client id
		this.players = {};

		//socket stuff
		this.created = Date.now();
		this.wss = new WebSocket.Server({
			port: 8080,
			perMessageDeflate: {
				zlibDeflateOptions: {
					chunkSize: 1024,
					memLevel: 7,
					level: 3
				},
				zlibInflateOptions: {
					chunkSize: 10 * 1024
				},
				clientNoContextTakeover: true,
				serverNoContextTakeover: true,
				serverMaxWindowBits: 10,
				concurrencyLimit: 10,
				threshold: 1024
			}
		});

		this.wss.on("connection", ws => {
			var PID = this.addClient();
			console.log("Client Connected:", PID);
			ws.PID = PID;

			ws.on("message", m => {
				var msg = decode(m);
				let data = msg.data;

				switch (msg.type) {
					case "join":

						// variables
						var name = data.name ? data.name : 'Anonymous';
						var type = data.type;
						var player = new Player(name, PID, type, 2);
						var player_lst = [obj_list(PID, player, ['name', 'type', 'orientation', 'score', 'speed'])];
						var wall_lst = [];
						var puck_lst = [];

						// send player to other clients
						this.gamecast(1, player_lst[0]);

						Object.entries(this.players).forEach(([key, value])=>{
							player_lst.push(obj_list(key, value, ['name', 'type', 'orientation', 'score', 'speed']));
						});
						Object.values(this.objects).forEach(object=>{
							wall_lst.push(object.x, object.y, object.radius);
						});
						Object.entries(this.pucks).forEach(([key, value]) => {
							puck_lst.push(obj_list(key, value, ['speed']));
						});
						console.log(puck_lst)

						// send players to client
						this.send(ws, 2, [player_lst, wall_lst, puck_lst]);
						this.players[PID] = player;
					break;
					case "input":
						try {
							this.players[PID].aim(data.mouse);
						} catch {
							console.log("Client", PID, "Used Inputs Without a Player")
						}
					break;
				}
			});

			//client has left
			ws.on("close", () => {
				this.removeClient(PID);//remove client
				try {
					this.removePlayer([PID]);//if the client had a player remove it
				} catch {
					console.log("Client Does Not Have a Player")
				}
			});
		});

		//Game Loop
		setInterval(()=>{
			past_date = current_date;
			current_date = Date.now();
			this.game_state(6*(current_date-past_date)/100)
		}, 1000 / 15);
	}

	game_state(dt){
		var players = [];
		var pucks = [];

		Object.values(this.players).forEach(body=>{
			body.updateVelocity(dt)
		});
		Object.values(this.pucks).forEach(body=>{
			body.updateVelocity(dt)
		});

		/*Puck collisions*/
		for(var i = this.pucks.length; i --;){
			var puck = this.pucks[i];
			var vx0 = puck.vx;
			var vy0 = puck.vy;

			/*Walls*/
			Object.values(this.objects).forEach(body=>{
				var contact = body.getContact(puck);
				var distance = contact.distance;
				var nx = contact.normalX;
				var ny = contact.normalY;

				var velAlongNormal = nx*vx0 + ny*vy0;
				var remove = velAlongNormal + distance;
				if(remove < 0) puck.bang(remove, -nx, -ny);
			});

			/*Pucks*/
			for(var j = this.pucks.length; j --;){
				if(j===i) continue;
				var body = this.pucks[j];
				var contact = body.getContact(puck);
				var distance = contact.distance;
				var nx = contact.normalX;
				var ny = contact.normalY;

				var relativeVx = vx0 - body.vx;
				var relativeVy = vy0 - body.vy;
				var velAlongNormal = nx*relativeVx + ny*relativeVy;
				var remove = (velAlongNormal + distance)/2;

				if(remove < 0){
					puck.bang(remove, -nx, -ny);
					body.bang(remove, nx, ny);
				}
			}
		}

		/*Player collisions*/
		Object.values(this.players).forEach(player => {
			var id = player.id;
			var vx0 = player.vx;
			var vy0 = player.vy;
			var vanguard = player.vanguard;
  
			/*Walls*/
			Object.values(this.objects).forEach(body=>{
				var contact = body.getContact(player.body);
				var distance = contact.distance;
				var nx = contact.normalX;
				var ny = contact.normalY;
				var velAlongNormal = nx*vx0 + ny*vy0;
				var remove = velAlongNormal + distance;
				if(remove < 0){
					player.bang(remove, -nx, -ny);
				}
			});

			/*Puck*/
			Object.values(this.pucks).forEach(puck => {
				var contacts = vanguard.getContact(puck);
				var vx1 = puck.vx;
				var vy1 = puck.vy;
				Object.values(contacts).forEach(contact => {
					var distance = contact.distance;
					var nx = contact.normalX;
					var ny = contact.normalY;

					var relativeVx = vx1 - vx0;
					var relativeVy = vy1 - vy0;
					var velAlongNormal = nx*relativeVx + ny*relativeVy;
					var remove = (velAlongNormal + distance)/2;
					if(remove < 0){
						player.bang(remove, nx, ny);
						player.score ++;

						puck.bang(remove, -nx, -ny);
						puck.sentBy = id;
					}
				});

				var distance = puck.getContact(player.body).distance;
				if(distance < 0) this.removePlayer([id, puck.sentBy])
			});

			/*Players*/
			Object.values(this.players).forEach(body=>{
				if(id === body.id) return;
				var contact = body.body.getContact(player.body);
				var distance = contact.distance;
				var nx = contact.normalX;
				var ny = contact.normalY;
				var vx1 = body.vx;
				var vy1 = body.vy;
				var relativeVx = vx0 - vx1;
				var relativeVy = vy0 - vy1;
				var velAlongNormal = nx*relativeVx + ny*relativeVy;
				var remove = (velAlongNormal + distance)/2;
				if(remove < 0){
					player.bang(remove, -nx, -ny);
					body.bang(remove, nx, ny);
				}
			});
		});

		/*Update player*/
		Object.entries(this.players).forEach(([key, value]) => {
			value.updatePosition();
			var collide = value.collide;
			var add = {
				key: key, 
				orientation: value.orientation,
				score: value.score
			};
			if(collide.hit){
				var angle = value.angle*RAD;
				var ct = Math.cos(angle);
				var st = Math.sin(angle);
				var d = 2*(collide.nx*ct + collide.ny*st);
				value.updateAngle(Math.atan2(st - collide.ny*d, ct - collide.nx*d));
				add = obj_list(key, value, ['orientation', 'score']);
			}

			players.push(add);
		});

		/*Update pucks*/
		Object.entries(this.pucks).forEach(([key, value]) => {
			value.updatePosition();
			var collide = value.collide;

			if(collide.hit){
				var angle = value.angle*RAD;
				var ct = Math.cos(angle);
				var st = Math.sin(angle);
				var d = 2*(collide.nx*ct + collide.ny*st);
				value.updateAngle(Math.atan2(st - collide.ny*d, ct - collide.nx*d));
				pucks.push(obj_list(key, value, []))
			}
		})
		this.gamecast(0, [players, pucks])//, Date.now()])
	}

	send(ws, type, data) {
		ws.send(
			encode({
				type,
				data
			})
		);
	}

	addClient(){
		var id = rand("pXC0XC");
		if (this.clients[id]) return this.addClient();
		this.clients[id] = id;
		return id;
	}

	removeClient(id) {
		delete this.clients[id];
		console.log("Removed Client ID:",id);
	}

	removePlayer(e) {

		// log event
		console.log("Removed Player ID:",e);

		// resolve player
		this.gamecast(3, e);
		delete this.players[e[0]];

		// increase player's score
		try {PLAYERS[e[1]].score += 2;} catch {}
	}

	gamecast(type, data){
		this.wss.clients.forEach(client => {
			if (client.readyState !== WebSocket.OPEN) return;
			let PID = client.PID;
			if(PID === void 0 || this.players[PID] === void 0) return;
			this.send(client, type, data);
		});
	}

	broadcast(type, data) {
		this.wss.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				this.send(client, type, data);
			}
		});
	}

	serialize() {
		var i = _.cloneDeep(this);

		delete i.wss;

		return JSON.parse(JSON.stringify(i));
	}
};

const game = new Game();

console.log(game.serialize());