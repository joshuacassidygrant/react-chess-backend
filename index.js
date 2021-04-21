const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.send('ahoyhoy');
});

server.listen(3001, () => {
  console.log('listening on :3001');
});