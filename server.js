const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.static('public'));

app.get("/", (req, res) => {
  res.send("Voice chat server is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let queue = [];

function matchUsers() {
  if (queue.length < 2) return;

  const user1 = queue.shift();
  const user2 = queue.shift();

  const room = `room-${user1.id}-${user2.id}`;

  user1.join(room);
  user2.join(room);

  user1.emit("matched", {
    room,
    initiator: true
  });

  user2.emit("matched", {
    room,
    initiator: false
  });
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("find", () => {
    if (!queue.find((s) => s.id === socket.id)) {
      queue.push(socket);
    }

    matchUsers();
  });

  socket.on("next", () => {
    queue = queue.filter((s) => s.id !== socket.id);

    queue.push(socket);

    matchUsers();
  });

  socket.on("signal", ({ room, data }) => {
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    queue = queue.filter((s) => s.id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});