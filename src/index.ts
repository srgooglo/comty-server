const { verbosity, __legacy__objectToArray } = require('@ragestudio/nodecore-utils')

const fs = require('fs')
const koa = require('koa')
const http = require('http')
const socketioAuth = require('socketio-auth')
const namespaces = require('./namespaces')

let node = new koa()
const server = http.createServer(node.callback())
const io = require('socket.io')(server)

let core_env = fs.readFileSync("./core_env.json", (err:any) => {
	console.log(err)
})

let env = {
	globalPort: "7000",
	addressBind: "localhost"
}

let sockets = [

]


if (core_env) {
	try {
		core_env = JSON.parse(core_env)
		env = { ...core_env, ...env }
	} catch (error) {
		console.error(error)
	}
} else {
	console.log('core_env not found, using default')
}

function setSessionHeader(payload:any) {
	const timeNow = new Date().getTime()
	console.log(payload.id)
}

function __init() {
	server.listen(env.globalPort)
	verbosity(`Server listening with port => ${env.globalPort}`)

	io.on('connection', (socket:any) => {
		setSessionHeader(socket)
		verbosity(`new connection from id => ${socket.id}`, { color: { 0: "green" } })

		socket.emit("updateState", { registeredNamespaces: namespaces })

		socket.on('disconnect', (socket:any) => {
			verbosity(`disconected from id => ${socket.id}`, { color: { 0: "magenta" } })
		})

		socket.on('floodTest', (e:any) => {
			const n = e + 1
			verbosity([`floodTest (recived)=> ${e} | sending => ${n}`])
			setTimeout(() => { socket.emit("floodTest", n) }, n)
		})

	})


	__namespaces()
}

function __namespaces() {
	let activatedSockets = []
	__legacy__objectToArray(namespaces).forEach(e => {
		try {
			sockets[e.key] = module.exports.auth = io.of(e.value)
			sockets[e.key].on('connection', require(`./sockets/${e.key}`)) //set auth
			activatedSockets.push(e.key)
		} catch (error) {
			verbosity([`Error activating [${e.key}] > ${error}`])
		}
	})
	verbosity([`MODULES AVAILABLE >`, activatedSockets], { color: { 0: "inverse" }, secondColor: { 0: "green" } })
}



__init()