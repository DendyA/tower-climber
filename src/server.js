const Constants = require("./constants.js");
const Room = require("./server/room.js");
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

let rooms = {};
let roomno = 1;
let roomnoStr = roomno.toString(10);
rooms[roomnoStr] = new Room(io, roomno, Constants.roomStates.waiting, Constants.maxPlayers);

let PORT = process.env.PORT || 4200;

app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html')
});

app.get('/playerCount', function (req, res){
   res.json({current: rooms[roomno.toString(10)].getNumOfPlayers(), total: Constants.maxPlayers});
});

app.get('/game', function (req, res){
   res.sendFile(__dirname + '/client/game.html');
});

io.on('connection', function (socket) {
   
   if(rooms[roomnoStr].getNumOfPlayers() >= Constants.maxPlayers || rooms[roomnoStr].getRoomState() != Constants.roomStates.waiting ) {
      roomno++;
      roomnoStr = roomno.toString(10);
      rooms[roomnoStr] = new Room(io, roomno, Constants.roomStates.waiting, Constants.maxPlayers);
   }

   console.log("Connecting to room " + roomno);
   rooms[roomnoStr].addPlayerToRoom(socket);

   socket.on('disconnect', function(){
      for(const key in rooms) {
          if(rooms[key].checkIfPlayerInRoom(socket.id)) {
              rooms[key].removePlayerFromRoom(socket);
              break;
          }
      }
   });

   socket.on('playerMovement', function (moveData){
       for (const key in rooms) {
           if (rooms[key].getRoomState() != Constants.roomStates.prep && rooms[key].checkIfPlayerInRoom(socket.id)) {
               rooms[key].updatePlayerMovement(socket, moveData);
               break;
           }
       }
   });

});
server.listen(PORT, function (){
   console.log(`Listening on ${PORT}`);
});
