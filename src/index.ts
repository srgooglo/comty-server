const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')

const fs = require('fs')
const koa = require('koa')
const http = require('http')
const socketioAuth = require('socketio-auth')
const namespaces = require('./namespaces')

const BodyParser = require("koa-bodyparser");
const Router = require("koa-router");
const Logger = require("koa-logger");
const serve = require("koa-static");
const mount = require("koa-mount");
const cors = require('koa-cors');
const HttpStatus = require("http-status");

let nodes = {
	global: new koa()
}


const server = http.createServer(nodes.global.callback())
const io = require('socket.io')(server)

let rc = fs.readFileSync("./.rcserver.json", (err:any) => {
	console.log(err)
})

let env = {
	globalPort: "7000",
	addressBind: "localhost"
}

let sockets = [

]

let sessionHeaders = [

]

if (rc) {
	try {
		rc = JSON.parse(rc)
		env = { ...rc, ...env }
	} catch (error) {
		console.error(error)
	}
} else {
	console.log('core_env not found, using default')
}

function setSessionHeader(payload:any) {
	const timeNow = new Date().getTime()
	sessionHeaders[payload.id] = { time: timeNow }
}

function _createServer() {
	server.listen(env.globalPort)
	verbosity(`Server listening with port => ${env.globalPort}`)

	io.on('connection', (socket:any) => {
		const { versions, platform, pid, uptime } = process
		setSessionHeader(socket)
		verbosity(`new connection | id => ${socket.id}`, { color: { 0: "green" } })
		socket.emit("updateState", {
			serverProcess: {
				versions,
				platform,
				pid,
				uptime 
			},
			sessionHeader: sessionHeaders[socket.id], 
			registeredNamespaces: namespaces,
			_rc: rc
		})

		socket.on('disconnect', (socket:any) => {
			verbosity(`disconected from id => ${socket.id}`, { color: { 0: "magenta" } })
		})

		socket.on('latency', (startTime, cb) => {
			cb(startTime)
		})

		socket.on('error', (event) => {
			verbosity([`New error dispatched >`, event])
		})

	})


	_initNamespaces()
}

function _initNamespaces() {
	let activatedSockets = []
	__legacy__objectToArray(namespaces).forEach(e => {
		try {
			sockets[e.key] = module.exports.auth = io.of(e.value)
			sockets[e.key].on('connection', require(`./sockets/${e.key}`)) 
			activatedSockets.push(e.key)
			console.log(sockets)
		} catch (error) {
			verbosity([`Error activating [${e.key}] > ${error}`])
		}
	})
	verbosity([`MODULES AVAILABLE >`, activatedSockets], { color: { 0: "inverse" }, secondColor: { 0: "green" } })
}

function _initMonitor(params:type) {
	const monitor = new koa()
	monitor.use(serve(__dirname + "../monitor/build"))
	nodes.global.use(mount("/", monitor))
}


_createServer()