const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let queue = [];

function matchUsers() {
  if (queue.length < 2) return;

  const user1 = queue.shift();
  const user2 = queue.shift();

  const room = `room-${user1.id}-${user2.id}`;

  user1.join(room);
  user2.join(room);

  user1.emit("matched", { room, initiator: true });
  user2.emit("matched", { room, initiator: false });
}

io.on("connection", (socket) => {

  socket.on("find", () => {
    if (!queue.includes(socket)) queue.push(socket);
    matchUsers();
  });

  socket.on("next", () => {
    queue = queue.filter(s => s.id !== socket.id);
    queue.push(socket);
    matchUsers();
  });

  // WebRTC signaling
  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnect", () => {
    queue = queue.filter(s => s.id !== socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});