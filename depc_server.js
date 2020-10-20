var {server_key} = require('./keys.js')
var server = require('http').createServer();
var io = require('socket.io')(server);
var socketioJwt = require('socketio-jwt');
var moment = require('moment')

var now = new Date().getTime();
var last_post_id = 0;

server.listen(5500);


// console.log(server_key)

// io.use(socketioJwt.authorize({
//   secret: server_key,
//   handshake: true
// }));

const feed_rf = io.of('/feed');
const user_chat = io.of('/chat')



feed_rf.on('connection', function (socket) {
  const now_1 = new Date().getTime()
  let frame_1 = {last_post_id: last_post_id, now: now_1}
 
  socket.emit('pull_event', frame_1 );

  socket.on('push_event', function (data) {
    last_post_id = data;
    const now_2 = new Date().getTime()
    let frame_2 = {last_post_id: data, now: now_2}

    console.log('push_event | trigger', frame_2);
    socket.broadcast.emit('pull_event', frame_2);
  });
})

let hashMap = [];

user_chat.on('connect', (socket) => {
  let conn_id;

  socket.on('conn', (payload) => {
    // push the socket id and username in the Hash
    conn_id = payload.id
    hashMap.push({username: payload.username, id: payload.id});

    // io.emit so that each connected user can see the updated user
    socket.emit('users', hashMap);
    socket.broadcast.emit('users', hashMap);

    console.log(`[${conn_id}] Connected`);
    console.log(hashMap);
  });

  socket.on('MessageCreated', (thread) => {
    // take the thread add timestamp to it and emit it  back
    thread.createdAt = moment(new Date).toString();
    /**
     * Find the socket id of the user for whom the message is sent
     * get teh username from the thread.to
     * then send that message bothe to the sender and the receiver 
     */

    // find the socketid 
    const itemFromHashMap = hashMap.find((set) => {
      console.log('set ', set);
      console.log('thread.to ', thread.to);
      return set.username === thread.to;
    });

    console.log(itemFromHashMap);

    const socketId = itemFromHashMap.id;
    console.log('Socket is: ', socketId);

    // sending to individual socketid
    socket.to(socketId).emit('NewMessage', thread);
    
    console.log(thread);
  });

  socket.on('disconnect', () => {
    // filter out the username from the hash map and emit 'NewUserList' 
    // to update the state in react client  side
    const newUsers = hashMap.filter((set) => set.id !== conn_id);
    hashMap = newUsers
    socket.broadcast.emit('users', hashMap);    
    console.log(`[ ${conn_id} ] Session ended `);
    console.log(newUsers);
  });
})
