const express = require('express');
const http = require('http');

const app = express();
const cors = require('cors');
const { json } = require('express');
const { RSA_PKCS1_PADDING } = require('constants');


app.use(cors());

const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });


app.get("/", (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.send('ahoyhoy');
});

const rooms = {};

io.on("connection", (socket) => {
    socket.on("request-move", (req) => {
        // TODO: validate move
        io.to(req.room).emit("approved-move", req.move);
    });
    socket.on("request-join-room", (req) => { 
      if (req.room in rooms) {
        rooms[req.room].users[socket.id]={socket: socket.id, name: req.name, role: -1};
      } else {
        rooms[req.room] = {id: req.room, users: {[socket.id]: {socket: socket.id, name: req.name, role: -1}}}
      }
      socket.join(req.room);
      io.to(req.room).emit("users-changed", rooms[req.room].users);
    });
    socket.on("request-role", (req) => {
      rooms[req.room].users[socket.id].role = req.role;
      io.to(req.room).emit("users-changed", rooms[req.room].users);
    });
    socket.on("request-chat", (req) => {
      io.to(req.room).emit("approved-chat", {username: req.username, message: req.message});
    });
    socket.on("leave-room", (room) => {
      if (!(room in rooms)) return;
      rooms[room].users = {...rooms[room].users, [socket.id]: undefined}
      io.to(room).emit("users-changed", rooms[room].users);
    })
    socket.on("disconnect", () => {
        console.log("disco");
    });

});

server.listen(3001, () => {
  console.log("listening on :3001");
});