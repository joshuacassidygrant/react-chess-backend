const express = require('express');
const http = require('http');

const app = express();
const cors = require('cors');


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

io.on("connection", (socket) => {
    console.log("user connected");
    socket.on("request-move", (move) => {
        console.log("message " + JSON.stringify(move));
        io.emit('approved-move', move);

    });
    socket.on("disconnect", () => {
        console.log("disco");
    });

});

server.listen(3001, () => {
  console.log("listening on :3001");
});