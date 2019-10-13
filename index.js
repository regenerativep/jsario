"use strict";
var express = require("express");
var WebSocket = require("ws");

var webapp, wsServer;
var messageResponses = {
    
};

function main()
{
    webapp = express();
    webapp.use(express.static("public"));

    wsServer = new WebSocket.Server({
        port: 5524
    });
    wsServer.on("connection", (socket, req) => {
        console.log("received connection from " + socket.url);
        socket.on("message", (data) => {
            var dataObj = JSON.parse(data);

        });
    });
}
function addMessageType(typeName, action)
{

}

main();