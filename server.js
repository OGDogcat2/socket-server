const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

let players = {};

io.on('connection', (socket) => {
  players[socket.id] = { x: 0, z: 0, health: 100, name: "Player" + Math.floor(Math.random()*1000) };

  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x += data.x * 0.1;
      players[socket.id].z += data.z * 0.1;
    }
    io.emit('updatePlayers', players);
  });

  socket.on('shoot', () => {
    for (let id in players) {
      if (id !== socket.id) {
        let dx = players[socket.id].x - players[id].x;
        let dz = players[socket.id].z - players[id].z;
        if (Math.sqrt(dx*dx + dz*dz) < 5) {
          players[id].health -= 10;
          if (players[id].health <= 0) {
            players[id].health = 100;
            players[id].x = Math.random()*100-50;
            players[id].z = Math.random()*100-50;
          }
        }
      }
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });
});

http.listen(3000, () => {
  console.log('Server started on port 3000');
});
