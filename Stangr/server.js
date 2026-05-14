// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server,{
  cors:{
    origin:"*"
  }
});

app.use(express.static(__dirname));

let waitingUser = null;

io.on("connection",(socket)=>{

  socket.on("find-stranger",(data)=>{

    socket.username = data.username;

    if(waitingUser){

      const room =
        "room-" +
        Math.random().toString(36).substring(2);

      socket.join(room);

      waitingUser.join(room);

      socket.emit(
        "matched",
        room,
        true
      );

      waitingUser.emit(
        "matched",
        room,
        false
      );

      waitingUser = null;

    }else{

      waitingUser = socket;
    }
  });

  socket.on("chat-message",(data)=>{

    socket.to(data.room)
    .emit("chat-message",{
      username:data.username,
      message:data.message
    });
  });

  socket.on("disconnect",()=>{

    if(waitingUser === socket){

      waitingUser = null;
    }
  });
});

server.listen(3000,()=>{

  console.log("Server started");
});