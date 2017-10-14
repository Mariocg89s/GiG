# GiG
Create two microservices for real time messages using websockets, and at least one demo subscriber.

# Requirements
For getting this project up and running you need NodeJS, NPM on your machine and then access to a RabbitMQ server.

# Installation
The project includes the 'package.json' file to properly install all the dependencies by running the command:

npm install

# Running the server & client
The project includes a web client for the socket.io, so we only have to run the server, and both the socket and the client will be available if the connection against the RabbitMQ server is correctly configured.
To start the server you only have to run the command:

node server.js

The server include the usage of the library Winston for logging, and the information would be displayed on console.

# Running tests
You have to run the following command from the root folder and not from the test folder:

mocha -R spec

# Client
To access the web client at the following url:
<server ip>:5000

# References
- Socket Setup & Mocha Test: http://liamkaufman.com/blog/2012/01/28/testing-socketio-with-mocha-should-and-socketio-client/
- Socket Client: https://github.com/socketio/chat-example
- Message Queue: https://github.com/squaremo/amqp.node
