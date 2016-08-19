var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile('/Users/josephlee/Desktop/rainingChainGuide/project/client/index.html');
})
app.use('/client', express.static('/Users/josephlee/Desktop/rainingChainGuide/project/client'));

serv.listen(2000);