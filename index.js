const express = require('express');
const http = require('http');

const app = express();
const cors = require('cors');
const randomWords = require("./random-word-list.json");
const {v4: uuidv4} = require("uuid");
const {validateReqRoom, validateUserId} = require("./data-utilities.js");

app.use(cors());

const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

const rooms = {};
const users = {};


app.get("/", (req, res) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
});

app.get("/random", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.send(randomWord(req.query.n));
});

app.get("/history", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  const room = req.query.room;
  if (rooms[room] && rooms[room].history) {
    res.send(rooms[room].history)
    return;
  }

  res.send([]);
})

app.get("/room", (req,res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  const room = req.query.room;
  if (!room || !(room in rooms)) {
    res.send(null);
    return;
  }
  res.send(rooms[room]);
})

app.get("/user", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");

  const uid = req.query.uid;
  const name = req.query.name;
  const room = req.query.room;

  let id;
  if (uid && uid in users) {
    // User is found
    id=uid;
    
  } else if (name) {
    id = uuidv4();
    users[id] = {id, name};
  } else {
    res.send({user: null, role: -1});
    return;
  }

  const role = (room && room in rooms && uid in rooms[room]) ? rooms[room].users[uid].role : -1;

  res.send({user: users[id], role});
})



io.on("connection", (socket) => {
    socket.on("request-move", (req) => {
        // TODO: validate move

        if (!rooms[req.room].history) {
          rooms[req.room].history = []
        }

        rooms[req.room].history.push(req.move);

        io.to(req.room).emit("approved-move", req.move);
    });

    socket.on("request-join-room", (req) => { 
      const uid = validateUserId(req, users, "request-join-room", false);
      const room = validateReqRoom(req, rooms, "request-join-room", true);
      const role = "role" in req ? req.role : -1;

      if (!room || !uid) {
        return;
      }

      socket.join(room);
      const newUsers = {...rooms[room].users, [uid]: {uid, data: users[uid], role}}
      rooms[room].users = newUsers;
 
      io.to(room).emit("users-changed", newUsers);
      io.emit("room-joined", {uid, room})

    });
    
    socket.on("request-role", (req) => {
      const uid = validateUserId(req, users, "request-role");
      const room = validateReqRoom(req, rooms, "request-role", false);
      if (!room || !uid) return;

      if (req.room in rooms &&  uid in rooms[req.room].users && rooms[req.room].users[uid]) {
        rooms[req.room].users[uid].role = req.role;
      }

      io.to(req.room).emit("users-changed", rooms[req.room].users);
    });

    socket.on("request-namechange", (req) => {
      const uid = validateUserId(req, users, "request-namechange");
      const room = validateReqRoom(req, rooms, "request-namechange", false);
      if (!room || !uid) return;
      users[uid].name = req.name;
      io.to(req.room).emit("users-changed", rooms[req.room].users);
    });

    socket.on("request-chat", (req) => {
      io.to(req.room).emit("approved-chat", {username: req.username, message: req.message});
    });

    socket.on("leave-room", (req) => {
      if (!req) return;
      const uid = validateUserId(req, users, "leave-room");
      const room = validateReqRoom(req, rooms, "leave-room", false);
      if (!room || !uid) return;

      rooms[room].users = {...rooms[req.room].users, [uid]: undefined}
      io.to(room).emit("users-changed", rooms[room].users);
    })

    socket.on("request-restart", (room) => {
      io.to(room).emit("restart-game");
    })

    socket.on("disconnect", () => {
        console.log("disconnecting...");
    });

});

server.listen(3001, () => {
  console.log("listening on :3001");
});

const randomWord = (n) => {
  let str = "";
  for (let i = 0 ; i < n; i++) {
    str += randomWords.words[Math.floor(Math.random() * randomWords.words.length)] + "-";
  }
  return str.slice(0, -1);
}