/*
Functionality:

1 - The first service should listen for incoming messages through the websocket protocol and when a new one arrives, the message should be published into message queue
2 - The second service should listen for incoming messages through the message queue and when a new message arrives, the message should be published to all the subscribers through the websocket protocol
*/

// First we declare the socket on port 5000
var port = process.env.PORT || 5000
var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

// Constant for loggin with Winston
const winston = require('winston')
winston.level = process.env.LOG_LEVEL || 'silly'
winston.loggers.add('development', {
	console: {
		level: winston.level,
		colorize: 'true'
	},
	file: {
		filename: './dev.log',
		level: 'warn'
	}
})
const development = winston.loggers.get('development')

// We create the connection to the message queue Rabbit MQ
// if this is working then we handle the websocket events
require('amqplib/callback_api').connect('amqp://localhost',{'heatbeat':5}, function(err, conn) {
	// TODO Message Queue Authentication through amqp://user:pass@localhost
	if (err != null)
		close(err)
	var queueName = 'GiG'

	conn.on("error", function(e){
		close(e)
	})
	conn.on('close', function connectionClose(){
		close('Connection closed')
    })

	conn.createChannel(function (err, ch) {
		if (err != null)
			close(err)

		// We serve the web which connects to the socket
		// and allow the client to send and received messages
		app.get('/', function(req, res){
			ch.assertQueue(queueName)
			res.sendFile(__dirname + '/index.html')
		})

		// Once the connection has been done with RabbitMQ we start
		// the web server to provide access to the client
		http.listen(port, function(){
			development.debug('listening on *:' + port)
		})

		// We declare the event handler for socket connections
		io.sockets.on('connection', function (socket) {

			// 1- We should handle 'message' events to broadcast any message
			socket.on('message', function(msg,cbFunction){
				development.debug('Message received on "message" socket event: ' + msg)
				ch.assertQueue(queueName)
				ch.sendToQueue(queueName, new Buffer(msg))

			})

			// 2- We listen to the message queue, if any message is received it will be
			// directly sent through websocket protocol as a broadcast message
			conn.createChannel(function (err, ch2) {
				if (err != null)
					close(err)
				ch2.assertQueue(queueName)
				ch2.consume(queueName, function(msg) {
					if (msg !== null) {
						development.debug('Message received from RabbitMQ: ' + msg.content.toString('utf8'))
						// Send the message text as string through socket
						io.sockets.emit('message', msg.content.toString('utf8'))
					}
				})
			})
		})
	})
})

function close(err) {
	development.error(err)
	process.exit(1)
}