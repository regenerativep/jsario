"use strict";
var express = require("express");
var WebSocket = require("ws");

var webapp, wsServer, gameWorld;
var gameUpdateInterval, clientUpdateInterval;
var messageResponses = {};

var lastCellId = 0;
class GameWorld
{
    constructor()
    {
        this.cellList = [];
        this.friction = 0.1;
    }
    findCellFromId(id)
    {
        for(let i = 0; i < this.cellList.length; i++)
        {
            let cell = this.cellList[i];
            if(cell.id == id)
            {
                return cell;
            }
        }
        return null;
    }
}
class GameCell
{
    constructor(world, x, y)
    {
        this.world = world;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.id = lastCellId++;
    }
    update()
    {
        let vSign = Math.sign(this.vx);
        if(this.vx * vSign > this.world.friction)
        {
            this.vx -= this.world.friction * vSign;
        }
        else
        {
            this.vx = 0;
        }
        vSign = Math.sign(this.vy);
        if(this.vy * vSign > this.world.friction)
        {
            this.vy -= this.world.friction * vSign;
        }
        else
        {
            this.vy = 0;
        }
        this.x += this.vx;
        this.y += this.vy;
    }
}
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
                vy: cell.vy
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