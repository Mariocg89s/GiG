var should = require('should')
var io = require('socket.io-client')

var socketURL = 'http://localhost:5000'

var options ={
  transports: ['websocket'],
  'force new connection': true
}

describe('GiG Tests',function(){

	/*
	This test will verify both services will be used by testing the
	websocket service for sending and recieving messages.
	First we use websocket to send the message, and it goes directly
	into the message queuea and then the message queue send the message
	to everyone who is connected and listening so our server also get
	the message, and send it back to everyone connected to the socket

	*/
	it('Should be able to broadcast messages', function(done){
		var client1, client2, client3

		var message = 'Example Message!'
		var messageCounter = 0


		// Function which will create the listener for the 'message' event on any client passed through parameter
		function checkMessage(client){
			client.on('message', function(msg){
				// the message stored should be equal to the message received
				message.should.equal(msg)
				client.disconnect()
				messageCounter++
				// Only if the 3 clients receive the message we asume the test has been correct.
				if(messageCounter === 3)
					done()
			})
		}

		client1 = io.connect(socketURL, options)
		checkMessage(client1)

		client1.on('connect', function(data){
			client2 = io.connect(socketURL, options)
			checkMessage(client2)

			client2.on('connect', function(data){
				client3 = io.connect(socketURL, options)
				checkMessage(client3)

				client3.on('connect', function(data){
					// When all clients are connected to the socket, we send a message from client2
					client2.send(message)
				})
			})
		})
	})

	/*
	This test will verify the RabbitMQ message queue usage

	*/
	it('Should be able to send and receive messages from RabbitMQ', function(done){
		var queueName = 'GiG'
		var message = 'Example Message - Message Queue!'
		var ch1,ch2
		function closeTest(err){
			if(err != undefined)
				console.log(err)
			if(ch1 != undefined)
				ch1.close()
			if(ch2 != undefined)
				ch2.close()
		}

		require('amqplib/callback_api').connect('amqp://localhost',{'heatbeat':5}, function(err, conn) {
			if (err != null)
				closeTest(err)

			conn.on('error', function(e){
				closeTest(e)
			})
			conn.on('close', function connectionClose(){
				closeTest('Connection closed')
			})

			conn.createChannel(function(err,ch) {
				if (err != null)
					closeTest(err)
				ch1 = ch
				ch1.assertQueue(queueName)
				// We declare the consume function with a higher priority to ensure we'll receive all messages
				ch1.consume(queueName, function(msg) {
					if (msg !== null) {
						// If the message received is exactly the same as the message sent we pass this test
						message.should.equal(msg.content.toString('utf8'))
						done()
						closeTest()
					}
				},{'priority':10})

				// We send the message to RabbitMQ
				conn.createChannel(function (err_, ch_) {
					if (err_ != null)
						closeTest(err_)
					ch2 = ch_
					ch2.assertQueue(queueName)
					ch2.sendToQueue(queueName, Buffer.from(message))
				})

			})
		})
	})
})