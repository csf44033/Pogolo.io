const { decode, encode } = require("@msgpack/msgpack");

module.exports = class Backend {
	constructor() {
		this.host = this.getHost();
		console.log(this.host)
		this.on_message = [];
		this.on_open = [];
		this.on_close = [];
		this.on_error = [];

		this.ws = new WebSocket(this.host);
		this.ws.onmessage = this._message.bind(this);
		this.ws.onopen = this._join.bind(this);
		this.ws.onclose = this._leave.bind(this);
		this.ws.onerror = this._error.bind(this);

		this.joined = false;
	}

	get open() {
		return this.ws.readyState == this.ws.OPEN;
	}

	get status() {
		return this.ws.readyState == this.ws.OPEN
			? "connected"
			: this.ws.readyState == this.ws.CLOSED
			? "closed"
			: this.ws.readyState == this.ws.CLOSING
			? "closing"
			: this.ws.readyState == this.ws.CONNECTING
			? "connecting"
			: "unkown";
	}

	send(type, data) {
		this.ws.send(
			encode({
				type,
				data
			})
		);
	}

	on(type, f) {
		this["on_" + type].push(f);
	}

	_message(g) {
		this.on_message.forEach(async m => {
			if (typeof g.data == "string") {
				return m(JSON.parse(g.data));
			}
			if (g.data instanceof Blob) {
				return m(decode(await g.data.arrayBuffer()));
			}
			if (g.data instanceof ArrayBuffer) {
				return m(decode(g.data));
			}
		});
	}

	_join() {
		this.on_open.forEach(m => {
			m.apply(null, arguments);
		});
		this.joined = true;
	}

	_leave() {
		this.on_close.forEach(m => {
			m.apply(null, arguments);
		});
	}

	_error() {
		this.on_error.forEach(m => {
			m.apply(null, arguments);
		});
	}

	getHost() {
		return "ws://127.0.0.1:8080";
	}
};