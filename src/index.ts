const { verbosity } = require('@ragestudio/nodecore-utils')

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

const authSocket = module.exports.auth = io.of('/auth');


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

		socket.on('pingPong', (e:any) => {
			verbosity(e)
			const n = e + 1
			setTimeout(() => { socket.emit("pingPong", n) }, n)
		})
	})


	__namespaces()
}

function __namespaces() {
	authSocket.on('connection', require('./sockets/auth')) //set auth

}



__init()