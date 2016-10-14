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

/* Entity */
var Entity = function(posX, posY)
{
    var self = {
        x:posX,
        y:posY,
        spdX:0,
        spdY:0,
        id:"",
    }
    
    self.update = function()
    {
        self.updatePosition();
    }
    
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    }
    return self;
}

/* Player */
var Player = function(id){
    var self = Entity(250,250);
    self.id=id;
    self.number= "" + Math.floor(10*Math.random());
    self.pressingRight=false;
    self.pressingLeft=false;
    self.pressingUp=false;
    self.pressingDown=false;
    self.pressingAttack = false;
    self.mousePosX = 0;
    self.mousePosY = 0;
    self.maxSpd=10;
    
    var super_update = self.update;
    self.update = function(){
        self.updateSpd();
        super_update();
   
        
//        console.log("isPressingAttack: " + self.pressingAttack);
        if(self.pressingAttack)
        {
            self.shootBullet(self.mousePosX, self.mousePosY);
        }
    }
    self.shootBullet = function(mousePosX, mousePosY){
        var b = Bullet(mousePosX, mousePosY, self.x, self.y);
    }
    
    self.updateSpd = function()
    {
        if(self.pressingRight)
        {
            self.spdX = self.maxSpd;
        }
        else if(self.pressingLeft)
        {
            self.spdX = -self.maxSpd;
        }
        else
        {
            self.spdX = 0;
        }
        
        if(self.pressingUp)
        {
            self.spdY = -self.maxSpd;
        }
        else if(self.pressingDown)
        {
            self.spdY = self.maxSpd;
        }
        else
        {
            self.spdY = 0;
        }
    }
    
    Player.list[id] = self;
    return self;
}
Player.list = {};
Player.onConnect = function(socket)
{
    var player = Player(socket.id);
    socket.on('keyPress', function(data){
        if(data.inputId === 'left')
        {
            player.pressingLeft = data.state;
        }
        else if(data.inputId === 'right')
        {
            player.pressingRight = data.state;
        }
        else if(data.inputId === 'up')
        {
            player.pressingUp = data.state;
        }
        else if(data.inputId === 'down')
        {
            player.pressingDown = data.state;
        }
        else if(data.inputId === 'attack')
        {
            player.pressingAttack = data.state;
            player.mousePosX = data.mousePosX;
            player.mousePosY = data.mousePosY;
        }
    })
}

Player.onDisconnect = function(socket)
{
    delete Player.list[socket.id];
}

Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({
            x:player.x, 
            y:player.y,
            number:player.number,
        });
    }
    return pack;
}

// angle in radians
var angleDegree = function(p1_x, p1_y, p2_x, p2_y)
{
    return Math.atan2(p2_y - p1_y, p2_x - p1_x) * 180 / Math.PI
};


var angleRadian = function(p1_x, p1_y, p2_x, p2_y)
{
    return Math.atan2(p2_y - p1_y, p2_x - p1_x);
}

/* Bullet */
var Bullet = function(mousePosX, mousePosY, startX, startY){
    var self = Entity(startX,startY);
    var speed = 40;
    var angle = angleRadian(-mousePosX, -mousePosY, -startX, -startY);

    self.id = Math.random();
    self.spdX = getXSpeed(angle, speed);
    self.spdY = getYSpeed(angle, speed);
    self.timer = 0;
    self.toRemove = false;
    
    var super_update = self.update;
    
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();
    }
    
    Bullet.list[self.id] = self;
}
Bullet.list = {};
Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list){
        var bullet = Bullet.list[i];
        bullet.update();
        pack.push({
            x:bullet.x, 
            y:bullet.y,
        });
    }
    return pack;
}

var getXSpeed = function(angle, distance) {
    return distance * Math.cos(angle);
}
var getYSpeed = function(angle, distance) {
    return distance * Math.sin(angle);

}

// var getQuadrant = function(mousePosX, mousePosY, startX, startY){
//     var x = mousePosX - startY;
//     var y = mousePosY - startY;
    
//     if(x == 0 && y == 0){
//         // do nothing - center point
//     }else if(x == 0 && y > 0){
//         return 
//     }
//     if(x >= 0 && y >= 0){
//         return 4;  // bottom right
//     }else if(x < 0 && y >= 0){
//         return 3;  // bottom left
//     }else if(x < 0 && y < 0){
//         return 2;  // top left
//     }else{ 
//         return 1;  // top right 
//     }
// }

var USERS = {
    // username:password
    "bob":"asdf",
    "bob2":"bob",
    "bob3":"ttt",
}

var isValidPassword = function(data){
    return USERS[data.username] === data.password;
}
var isUsernameTaken = function(data){
    return USERS[data.username];
}
var addUser = function(data){
    return USERS[data.username] = data.password;
}

/* Server to Client communication */
var DEBUG = true;
var io = require('socket.io') (serv, {});  
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    
    socket.on('signIn', function(data){
        if(isValidPassword(data)){
            Player.onConnect(socket);
            socket.emit('signInResponse',{success:true});
        }else{
            socket.emit('signInResponse',{success:false});
        }
    });

    socket.on('signUp', function(data){
        if(isUsernameTaken(data)){
            socket.emit('signUpResponse',{success:false})
        }else{
            addUser(data);
            socket.emit('signUpResponse',{success:true})
        }

    });

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });
    
    socket.on('sendMsgToServer', function(data) {
        var playerName = ("" + socket.id).slice(2,7);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
        }
    });
    
    socket.on('evalServer', function(data) {
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer', res);
    });
});

/* Update */
setInterval(function(){
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }
}, 1000/25);