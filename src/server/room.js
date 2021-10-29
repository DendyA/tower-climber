const Constants = require("../constants.js");

class Room {
    roomNum;
    playersInRoom = {};

    constructor(io, roomNumber, intialState, maxPlayers) {
        this.io = io;
        this.roomNum = roomNumber;
        this.roomState = intialState;
        this.maxPlayers = maxPlayers;
        this.updateInterval = this.init();
    }

    // Initializes the update loop
    init() {
        return setInterval(() => {
            // Update loop for room
            // Not using at the moment, arbitrary interval time
        }, 1000); 
    }

    addPlayerToRoom(socket) {
        console.log('User ' + socket.id + ' joined');
        socket.join("room-" + this.roomNum);

        let _order = Object.keys(this.playersInRoom).length;
        if (Number.isNaN(_order))
            _order = 0;

        this.playersInRoom[socket.id] = {
            order: _order,
            rotation: 0,
            x: 115,
            y: 1260,
            playerId: socket.id,
            friendlyName: this.getNumOfPlayers() + 1,
            roomNum: this.roomNum, // TODO: Have players choose thier friendly names.
            ready: false // Not doing anything with this yet.
        };
        console.log(this.playersInRoom[socket.id].roomNum)

        socket.emit('currentPlayers', this.playersInRoom);
        socket.to('room-' + this.roomNum).emit('newPlayer', this.playersInRoom[socket.id], this.getNumOfPlayers());
        this.beginMatchIfReady();
    }

    removePlayerFromRoom(socket) {
        console.log('User ' + socket.id + ' left');
        socket.leave('room-' + this.roomNum);
        delete this.playersInRoom[socket.id];
        socket.to("room-" + this.roomNum).emit('disconnectPlayer', socket.id, this.getNumOfPlayers());
    }

    updatePlayerMovement(socket, moveData) {
        //console.log('got moveData ' + moveData);

        this.playersInRoom[socket.id].x += moveData.px + moveData.vx;
        this.playersInRoom[socket.id].y += moveData.py + moveData.vy;

        moveData.playerId = socket.id;
        if (moveData.py >= Constants.belowWorld) {
            this.io.in('room-' + this.roomNum).emit('resetPlayer', moveData);
        } else {
            socket.to('room-' + this.roomNum).emit('playerMoved', moveData);
        }
        this.checkIfPastGoal(moveData, socket);
    }

    // Checks to see if the move has put the player past the goal (defined in constants)
    // If it has, send message to all members of the room, including the player that reached the goal,
    // that someone has won and the game is over. Room transitions to "end" state.
    checkIfPastGoal(moveData, socket) {
        if(moveData.py <= Constants.goalLocation && this.roomState == Constants.roomStates.running) {
            this.roomState = Constants.roomStates.end;
            this.io.in('room-' + this.roomNum).emit('gameOver', this.playersInRoom[socket.id].friendlyName);
            console.log(`Player ${this.playersInRoom[socket.id].friendlyName} Wins!`);
        }
    }

    // Check to see if the room has reached capacity and is ready to start the game countdown.
    // If the room is full, we enter a brief ready state so the last player joining is shoved straight into a countdown.
    // After ready state state is over (see Constants.readyUpTime), we begin the countdown.
    beginMatchIfReady() {
        //TODO: provide UI to start the room if there are >= 2 players
        if(this.checkRoomIsFull()) {
            this.roomState = Constants.roomStates.ready;
            this.io.in('room-' + this.roomNum).emit('readyUp');
            console.log(`Room is full, countdown starts in ${Constants.readyUpTime} seconds`);
            let count = Constants.countdownTime + Constants.readyUpTime + 1;
            // Sends message to players every second, client side will rely on this to display countdown to player.
            let countdownInterval = setInterval(() => {
                count--;

                if (count == Constants.prepareTime) {
                    this.roomState = Constants.roomStates.prep;
                    this.io.in('room-' + this.roomNum).emit('prep');
                }

                if(count <= Constants.countdownTime && count > 0) {
                    // Countdown has started, messages being sent once a second.
                    if (count === Constants.countdownTime ) this.roomState = Constants.roomStates.countdown;
                    this.io.in(`room-${this.roomNum}`).emit('currentCountdown', count);
                    console.log(`Game starting in ${count} seconds`);
                } else if(count === 0) {
                    // Countdown is over, clean up and start game.
                    clearInterval(countdownInterval);
                    this.handleGameStart();
                }
            }, 1000);
        }
    }

    handleGameStart() {
        this.io.in('room-' + this.roomNum).emit('startGame');
        this.roomState = Constants.roomStates.running;
        console.log('Start Game!');
    }

    checkRoomIsFull() {
        return this.maxPlayers === this.getNumOfPlayers();
    }

    checkIfPlayerInRoom(socketId) {
        return socketId in this.playersInRoom;
    }

    getPlayersInRoom() {
        return this.playersInRoom;
    }

    getNumOfPlayers() {
        return Object.keys(this.playersInRoom).length;
    }

    getRoomState() {
        return this.roomState;
    }

    closeRoom() {
        clearInterval(this.updateInterval);
    }
}

module.exports = Room;
