module.exports = {
    roomStates: {
        waiting: 0, // Before room has reached capacity
        ready: 1, // Short amount of time between a room becoming full and the countdown starting
        countdown: 2, // Countdown phase
        prep: 3, // movement locked, prep for start
        running: 4, // Active game
        end: 5, // Goal state has been reached
    },
    maxPlayers: 3, // Maximum number of players in a room ** Make sure to change the MAX_PLAYERS constant in game.js **
    countdownTime: 10, // seconds
    prepareTime: 3, // time left on countdown when players get reset and movement gets locked
    readyUpTime: 5, // seconds
    goalLocation: 0, // y coordinates of goal
    belowWorld: 2400, // Reset point for falling off world
}