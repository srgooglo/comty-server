const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')

const fs = require('fs')
const koa = require('koa')
const http = require('http')

const socketIo = require('socket.io')
const socketioAuth = require('socketio-auth')
const namespaces = require('./namespaces')

const BodyParser = require("koa-bodyparser")
const Router = require("koa-router")
const Logger = require("koa-logger")
const serve = require("koa-static")
const mount = require("koa-mount")
const cors = require('koa-cors')
const HttpStatus = require("http-status")

let nodes = {
	global: new koa()
}

const serverHttp = http.createServer(nodes.global.callback())
const io = socketIo(serverHttp)

let rc = fs.readFileSync("./.rcserver.json", (err:any) => {
	console.log(err)
})

let env = {
	globalPort: "7000",
	addressBind: "localhost"
}
// @ts-ignore
let sockets = [

]
// @ts-ignore
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
	serverHttp.listen(env.globalPort)
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
			// @ts-ignore
			sessionHeader: sessionHeaders[socket.id], 
			registeredNamespaces: namespaces,
			_rc: rc
		})

		socket.on('disconnect', (socket:any) => {
			verbosity(`disconected from id => ${socket.id}`, { color: { 0: "magenta" } })
		})
// @ts-ignore
		socket.on('latency', (startTime, cb) => {
			cb(startTime)
		})
// @ts-ignore
		socket.on('error', (event) => {
			verbosity([`New error dispatched >`, event])
		})

	})


	_initNamespaces()
}

function _initNamespaces() {
	let activatedSockets = []
	// @ts-ignore
	__legacy__objectToArray(namespaces).forEach(e => {
		try {
			sockets[e.key] = module.exports.auth = io.of(e.value)
			// @ts-ignore
			sockets[e.key].on('connection', (socket) => {
				socket._rc = rc
				require(`./sockets/${e.key}`)(socket)
			}) 
			activatedSockets.push(e.key)
		} catch (error) {
			verbosity([`Error activating [${e.key}] > ${error}`])
		}
	})
}

function _initMonitor(params:any) {
	const monitor = new koa()
	monitor.use(serve(__dirname + "../monitor/build"))
	nodes.global.use(mount("/", monitor))
}


_createServer()