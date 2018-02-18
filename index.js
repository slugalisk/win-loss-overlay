'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const EventEmitter = require('events');
const http = require('http');
const sio = require('socket.io');

class Counter extends EventEmitter {
  constructor() {
    super();

    this.score = {
      wins: 0,
      losses: 0,
    };
  }

  incrWins(v = 1) {
    this.score.wins += v;
    this.emit('change', this.score);
  }

  incrLosses(v = 1) {
    this.score.losses += v;
    this.emit('change', this.score);
  }

  reset(v) {
    this.score.wins = this.score.losses = 0;
    this.emit('change', this.score);
  }
}

var counter = new Counter();

var api = express().use(bodyParser);

api.post('/reset', function(req, res) {
  counter.reset();
});

api.post('/incr-wins', function(req, res) {
  counter.incrWins(req.body.value);
});

api.post('/incr-losses', function(req, res) {
  counter.incrLosses(req.body.value);
});

var app = express();
var server = http.Server(app);
var io = sio(server);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use('/api', api);

io.on('connection', function(socket) {
  function sendScore() {
    socket.emit('update', counter.score);
  }
  sendScore();

  socket.on('disconnect', function() {
    counter.removeListener('change', sendScore);
  });

  counter.on('change', sendScore);
});

server.listen(3030);
console.log('listening on *:%d', server.address().port);
