var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile('/Users/josephlee/Desktop/rainingChainGuide/project/client/index.html');
})
app.use('/client', express.static('/Users/josephlee/Desktop/rainingChainGuide/project/client'));

console.log("Server started."); // messages the server when server started
serv.listen(2000);  // listening to port 2000 on localhost (localhost:2000)

var io = require('socket.io') (serv, {});   

var SOCKET_LIST = {};

io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    socket.x = 0;
    socket.y = 0;
    socket.number = "" + Math.floor(10 * Math.random());
    SOCKET_LIST[socket.id] = socket;
	socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
    })
});

setInterval(function(){
    var pack = [];
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.x++;
        socket.y++;
        pack.push({
            x:socket.x, 
            y:socket.y,
            number:socket.number
        });
    }
    for(var i in SOCKET_LIST){
        socket.emit('newPosition', pack);
    }
}, 1000/25);