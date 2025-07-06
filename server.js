const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const games = {};

io.on("connection", (socket) => {
  socket.on("join-game", (gameID) => {
    socket.join(gameID);
    if (!games[gameID]) games[gameID] = { turn: 0 };
    const clients = Array.from(io.sockets.adapter.rooms.get(gameID) || []);
    if (clients.length === 1) {
      io.to(clients[0]).emit("your-turn");
    }
  });

  socket.on("next-turn", (gameID) => {
    const room = io.sockets.adapter.rooms.get(gameID);
    if (!room) return;
    const clients = Array.from(room);
    clients.forEach((clientID) => {
      io.to(clientID).emit("next-turn");
    });
    const next = (games[gameID].turn + 1) % clients.length;
    io.to(clients[next]).emit("your-turn");
    games[gameID].turn = next;
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server ready on port ${PORT}`));
