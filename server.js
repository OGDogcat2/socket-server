const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const lobbies = {}; // { lobbyId: { players: {} } }

io.on('connection', socket => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createLobby', () => {
    const lobbyId = uuidv4().slice(0, 5); // Shorter Lobby ID
    lobbies[lobbyId] = { players: {} };
    socket.join(lobbyId);
    socket.lobbyId = lobbyId;
    lobbies[lobbyId].players[socket.id] = { x: 0, z: 0 };
    socket.emit('lobbyCreated', { lobbyId });
    console.log(`Lobby created: ${lobbyId}`);
  });

  socket.on('joinLobby', ({ lobbyId }) => {
    if (lobbies[lobbyId]) {
      socket.join(lobbyId);
      socket.lobbyId = lobbyId;
      lobbies[lobbyId].players[socket.id] = { x: 0, z: 0 };
      socket.emit('joinedLobby', { lobbyId });
      console.log(`User ${socket.id} joined lobby ${lobbyId}`);
    } else {
      socket.emit('error', 'Lobby does not exist.');
    }
  });

  socket.on('move', move => {
    const lobbyId = socket.lobbyId;
    if (lobbyId && lobbies[lobbyId] && lobbies[lobbyId].players[socket.id]) {
      const player = lobbies[lobbyId].players[socket.id];
      player.x += move.x * 0.1;
      player.z += move.z * 0.1;

      io.to(lobbyId).emit('updatePlayers', lobbies[lobbyId].players);
    }
  });

  socket.on('disconnect', () => {
    const lobbyId = socket.lobbyId;
    if (lobbyId && lobbies[lobbyId]) {
      delete lobbies[lobbyId].players[socket.id];
      if (Object.keys(lobbies[lobbyId].players).length === 0) {
        delete lobbies[lobbyId];
        console.log(`Lobby ${lobbyId} deleted`);
      }
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running...');
});

