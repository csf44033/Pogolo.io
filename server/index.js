const PI = Math.PI;
const TAU = PI*2;
const RAD = PI/180

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
Body.prototype.updateAngle = function(angle, dt){
	var speed = this.speed;
	angle = round(angle/RAD, 1);
	this.angle = angle;
	angle*=RAD;
    this.vx = Math.cos(angle)*speed*dt;
	this.vy = Math.sin(angle)*speed*dt;

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

	this.oriantation = 0;
	this.score = 0;
	this.pastScore = 0;
	this.killed = [];
};
Player.prototype = Object.create(Body.prototype);
Player.prototype.updatePosition = function(){
	this.x += this.vx;
	this.y += this.vy;
	this.vanguard.x = this.body.x = this.x;
	this.vanguard.y = this.body.y = this.y;
};
Player.prototype.aim = function(angle) {
	this.oriantation = angle;
	var v = this.vanguard;
	v.start = angle - TAU/15;
	v.end = angle + TAU/15;
};

//2.5 speed
function Puck (x,y){
	Circle.call(this, x, y, 22.5, 2.5, 1);
	this.angle = round(Math.random()*360,1);

	this.sentBy = void 0;
	this.bounced = true;
}
Puck.prototype = Object.create(Circle.prototype);

const Game = class {
	constructor() {
		//Game Data
		this.size = 600;

		this.objects = [];
		this.pucks = [];
		//create default map (radius[400]-stroke[])
		this.objects.push(new inverseCircle(0,0,397.5,0))//400-stroke
		for(var i = 0; i < 2; i ++){
			var r = Math.random()*60+60;
			var a = Math.random()*TAU;
			var l = Math.random()*(400-r-120);
			var x = Math.cos(a)*l;
			var y = Math.sin(a)*l;
			var no = false;
			for(var j = 1; j < 1+i; j ++){
				var dx = this.objects[j].x-x;
				var dy = this.objects[j].y-y;
				var d = dx*dx + dy*dy;
				if(d<Math.pow(r+this.objects[j].radius+120,2)){
					no = true;
					break;
				}
			}
			if(no){
				i--;
				continue;
			}
			this.objects.push(new Circle(Math.cos(a)*l,Math.sin(a)*l,r,0))//400-stroke
		}
		for(var i = 0; i < 3; i ++){
			var r = 22.5;
			var a = Math.random()*TAU;
			var l = Math.random()*(400-r-120);
			this.pucks.push(new Puck(Math.cos(a)*l,Math.sin(a)*l));
		}

		this.clients = {};//stores client id
		this.players = {};

		this.scoreboard = [];

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
						let name = data.name;
						let type = data.type;
						if(name.length === 0) name = "Anonymous";

						//id,name,type,id,name,type...
						var message = [PID, name, type]

						//broadcast player joined
						this.gamecast(1, message);
						message = [message,[],this.pucks.length]
						//add other players to message
						Object.values(this.players).forEach(player=>{
							message[0].push(player.id, player.name, player.type);
						});
						Object.values(this.objects).forEach(object=>{
							message[1].push(object.x, object.y, object.radius);
						});

						//send players to client
						this.send(ws, 2, message);

						//add player
						this.players[PID] = new Player(name, PID, type, 2);
						console.log("Client", PID, "Created Player", name);
					break;
					case "input":
						try {
							this.players[PID].aim(data.mouse*RAD);
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
					this.removePlayer(PID);//if the client had a player remove it
				} catch {
					console.log("Client Does Not Have a Player")
				}
			});
		});

		//Game Loop
		setInterval(() => {
			//this.updateObjects();
			//this.checkScore();
			this.game_state();
		}, 1000 / 15);
	}
	game_state(dt){
		dt=4;
		var players = [];
		var pucks = [];

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
				if(remove < 0) player.bang(remove, -nx, -ny);
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
						puck.bang(remove, -nx, -ny);
					}
				});

				var distance = puck.getContact(player.body).distance;
				if(distance < 0){
					this.removePlayer(id)
					return;
				}
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
		Object.values(this.players).forEach(player => {
			player.updatePosition();
			var collide = player.collide;

			if(collide.hit){
				var angle = player.angle*RAD;
				var ct = Math.cos(angle);
				var st = Math.sin(angle);
				var d = 2*(collide.nx*ct + collide.ny*st);
				player.updateAngle(Math.atan2(st - collide.ny*d, ct - collide.nx*d), dt);
			}

			players.push(
				player.id,
				round(player.x, 10),
				round(player.y, 10),
				round(player.oriantation/RAD,1),
				player.angle
			);
		});

		/*Update pucks*/
		Object.values(this.pucks).forEach(puck=>{
			puck.updatePosition();
			var collide = puck.collide;

			if(collide.hit){
				var angle = puck.angle*RAD;
				var ct = Math.cos(angle);
				var st = Math.sin(angle);
				var d = 2*(collide.nx*ct + collide.ny*st);
				puck.updateAngle(Math.atan2(st - collide.ny*d, ct - collide.nx*d), dt);
			}

			pucks.push(
				round(puck.x, 10),
				round(puck.y, 10),
				puck.angle,
			);
		})
		this.gamecast(0, [players, pucks])
	}
	updateObjects(){

		//test for death
		Object.values(this.players).forEach(player=>{
			var b = player.body;
			var id = player.id;
			for(var i = 1; i < 4; i ++){
				var ball = this.objects[i];
				let contact = b.getContact(ball);
				let distance = contact.distance;
				if(distance > 0) continue;

				try {
					let p = this.players[ball.sentBy];
					p.score += 5;
					p.killed.push(player.name);
				} catch {
					console.log("Puck Did Not Have a Sender")
				}

				this.removePlayer(id);//delete player
				break;
			}
		})
		{/*
		Object.values(this.objects).forEach(index=>{

			//var player = this.objects[index];
			//let v = player.vanguard;//arc
			//let b = player.body;	//circle
			//let id = player.id;		//player id

			//collide with balls
			for(var j = 0; j < this.balls.length; j ++){
				let ball = this.balls[j];
				let contact = v.getContact(ball);
				let distance = contact.distance;
				let nx = contact.normalX;
				let ny = contact.normalY;

				//if ball is in arc
				if(distance < 0){
					var newhit = ball.sentBy !== id;
					if(newhit === true) ball.bounced = true;
					if(newhit === true || ball.bounced === true){
						player.score ++;
						ball.sentBy = id;
						ball.bounced = false
					}

					//move ball out of arc
					ball.x -= nx*distance;
					ball.y -= ny*distance;
					//reflect balls velocity
					let p = player.vx * nx + player.vy * ny - ball.vx * nx - ball.vy * ny;
					player.vx -= p * nx;
					player.vy -= p * ny;
					let magnitude = player.speed/Math.sqrt(player.vx*player.vx + player.vy*player.vy);
					player.vx*=magnitude;
					player.vy*=magnitude;

					ball.vx += p * nx;
					ball.vy += p * ny;
					magnitude = ball.speed/Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
					ball.vx*=magnitude;
					ball.vy*=magnitude;
				}else{//if the arc has not guarded, check collision with circle
					contact = b.getContact(ball);
					distance = contact.distance;
					//if ball is in circle
					if(distance < 0){
						let b = ball.sentBy;
						if((this.players[b] !== void 0) && (b !== id)){
							let p = this.players[b];
							p.score += 5;
							p.killed.push(player.name);
						}
						this.removePlayer(id);//delete player
						return;//ignore anything else
					}
				}
			}

			//collide with players
			Object.values(this.players).forEach(p=>{
				if(id === p.id) return;//do not collide with self
				let ob = p.body;
				let contact = ob.getContact(b);
				let distance = contact.distance;
				let nx = contact.normalX;
				let ny = contact.normalY;
				if(distance>=0) return;//player not colliding

				let d = player.vx * nx + player.vy * ny - p.vx * nx - p.vy * ny;
				player.vx -= d * nx;
				player.vy -= d * ny; 
				let v = player.speed/Math.sqrt(player.vx*player.vx + player.vy*player.vy);
				player.vx*=v;
				player.vy*=v;

				p.vx += d * nx; 
				p.vy += d * ny;
				v = p.speed/Math.sqrt(p.vx*p.vx + p.vy*p.vy);
				p.vx*=v;
				p.vy*=v;
			});
			for(var j = 0; j < this.arena.length; j ++){
				var a = this.arena[j];
				var contact = a.getContact(b);
				var distance = contact.distance;
				var nx = contact.normalX;
				var ny = contact.normalY;
				if(distance>=0) continue;
				var d = 2*(nx*player.vx + ny*player.vy);
				player.vx -= nx*d;
				player.vy -= ny*d;
			}
		});

		var bodies = this.arena.concat(this.balls);
		for(var i = 0, N = bodies.length; i < N; i ++){
			for(var j = i + 1; j < N; j ++){
				var bodyA = bodies[i];
				var bodyB = bodies[j];
				var aInverseMass = bodyA.inverseMass;
				var bInverseMass = bodyB.inverseMass;
				if (aInverseMass === 0 && bInverseMass === 0) continue
				var contact = bodyA.getContact(bodyB);
				var distance = contact.distance;
				var nx = contact.normalX;
				var ny = contact.normalY;
				if(distance>=0) continue;

				bodyB.x -= nx*distance;
				bodyB.y -= ny*distance;

				if(aInverseMass){
					let p = bodyA.vx * nx + bodyA.vy * ny - bodyB.vx * nx - bodyB.vy * ny;
					bodyA.vx -= p * nx;
					bodyA.vy -= p * ny;
					let v = bodyA.speed/Math.sqrt(bodyA.vx*bodyA.vx + bodyA.vy*bodyA.vy);
					bodyA.vx*=v;
					bodyA.vy*=v;

					bodyB.vx += p * nx; 
					bodyB.vy += p * ny;
					v = bodyB.speed/Math.sqrt(bodyB.vx*bodyB.vx + bodyB.vy*bodyB.vy);
					bodyB.vx*=v;
					bodyB.vy*=v;
				}else{
					let d = 2*(nx*bodyB.vx + ny*bodyB.vy);
					bodyB.vx -= nx*d;
					bodyB.vy -= ny*d;
					bodyB.bounced = true;
				}
			}
		}*/}
	}

	sortScore (a, b){
		return b.score - a.score;
	}

	checkScore(){
		let scoretracker = [];
		Object.values(this.players).forEach(player => {//loop through players
			scoretracker.push({id:player.id, score:player.score});
		});
		let N = scoretracker.length;
		if(N){
			scoretracker.sort(this.sortScore).slice(0,5);
			if(this.scoreboard.length === N){
				let changed = false;
				for(let i = 0; i < N; i ++){
					if((this.scoreboard[i].id !== scoretracker[i].id) || (this.scoreboard[i].score !== scoretracker[i].score)){
						changed = true;
						break;
					}
				}
				if(changed) this.sendScore(scoretracker)
				return;
			}
			this.sendScore(scoretracker);
		}
	};

	sendScore(scores){
		this.gamecast(5, scores);
		this.scoreboard = scores;
	}

	playerInfo(id){
		let p = this.players[id];
		let message = [id, [], [-Math.round(p.x*10)/10, -Math.round(p.y*10)/10], []];
		Object.values(this.players).forEach(player=>{
			message[1].push([player.id, player.name, player.type, Math.round(player.x*10)/10, Math.round(player.y*10)/10]);
		});

		console.log("Sent",message);
		return message;
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

	removePlayer(id) {
		this.gamecast(3, id);
		delete this.players[id];
		console.log("Removed Player ID:",id);
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