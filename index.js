"use strict";
var express = require("express");
var WebSocket = require("ws");

var wlrdJs = require("./public/world.js");
var GameWorld = wlrdJs.GameWorld;
var GameCell = wrldJs.GameCell;

var webapp, wsServer, gameWorld;
var gameUpdateInterval, clientUpdateInterval;
var messageResponses = {};


class GameUser
{
    constructor(socket)
    {
        this.socket = socket;
        this.cells = [];
    }
    sendCellList()
    {
        let cellIds = [];
        for(let i = 0; i < this.cells.length; i++)
        {
            cellIds.push(this.cells[i].id);
        }
        this.socket.send(JSON.stringify({
            type: "youare",
            cellIds: cellIds
        }));
    }
}

var users = [];
function readProp(val, def)
{
    if(typeof val === "undefined")
    {
        return def;
    }
    return val;
}
function findUserFromSocket(socket)
{
    for(let i = 0; i < users.length; i++)
    {
        let user = users[i];
        if(user.socket == socket)
        {
            return user;
        }
    }
    return null;
}
function main()
{
    gameWorld = new GameWorld();
    gameUpdateInterval = setInterval(() => {
        gameWorld.update();
    }, 1000 / 60);
    clientUpdateInterval = setInterval(() => {
        let cellDataList = [];
        for(let i = 0; i < gameWorld.cellList.length; i++)
        {
            let cell = gameWorld.cellList[i];
            cellDataList.push({
                x: cell.x,
                y: cell.y,
                id: cell.id,
                vx: cell.vx,
                vy: cell.vy,
                mass: cell.mass
            });
        }
        for(let i = 0; i < users.length; i++)
        {
            let user = users[i];
            user.socket.send(JSON.stringify({
                type: "allCellUpdate",
                cellList: cellDataList
            }));
        }
    }, 1000 / 60);

    messageResponses["ping"] = (data, socket) => {
        socket.send(JSON.stringify({
            type: "pong",
            id: readProp(data.id, -1)
        }));
    };
    messageResponses["register"] = (data, socket) => {
        let cell = new GameCell(gameWorld, 0, 0);
        let user = new GameUser(socket);
        user.cells.push(cell);
        gameWorld.cellList.push(cell);
        user.sendCellList();
    };
    messageResponses["input"] = (data, socket) => {
        let user = findUserFromSocket(socket);
        let targetX = readProp(data["x"], 0);
        let targetY = readProp(data["y"], 0);
        let doSplit = readProp(data["split"], false);
        for(let i = 0; i < user.cells.length; i++)
        {
            let cell = user.cells[i];
            cell.targetX = targetX;
            cell.targetY = targetY;
            if(doSplit)
            {
                let newCell = cell.split();
                user.cells.push(newCell);
            }
        }
        if(doSplit)
        {
            for(let i = 0; i < user.cells.length; i++)
            {
                let cell = user.cells[i];
                let newCell = cell.split();
                user.cells.push(newCell);
            }
            user.sendCellList();
        }
    };

    webapp = express();
    webapp.use(express.static("public"));

    wsServer = new WebSocket.Server({
        port: 5524
    });
    wsServer.on("connection", (socket, req) => {
        console.log("received connection from " + req.connection.remoteAddress);
        socket.on("message", (dataStr) => {
            let dataObj = JSON.parse(dataStr);
            let actionName = dataObj.type;
            if(messageResponses.hasOwnProperty(actionName))
            {
                messageResponses[actionName](dataObj, socket);
            }
        });
    });
}

main();