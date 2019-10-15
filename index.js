"use strict";
var express = require("express");
var WebSocket = require("ws");

var wrldJs = require("./public/world.js");
var GameWorld = wrldJs.GameWorld;
var GameCell = wrldJs.GameCell;

var webapp, wsServer, gameWorld;
var gameUpdateInterval, clientUpdateInterval;
var messageResponses = {};

class GameUser
{
    constructor(socket, id)
    {
        this.socket = socket;
        this.cells = [];
        this.id = id;
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
function findUserFromId(id)
{
    for(let i = 0; i < users.length; i++)
    {
        let user = users[i];
        if(user.id == id)
        {
            return user;
        }
    }
}
function idInUsers(id)
{
    for(let i = 0; i < users.length; i++)
    {
        if(users[i].id == id)
        {
            return true;
        }
    }
    return false;
}
function getNextAvailableId()
{
    let id = 0;
    while(idInUsers(id))
    {
        id++;
    }
    return id;
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
                mass: cell.mass,
                radius: cell.radius
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
    messageResponses["register"] = (data, socket, id) => {
        if(findUserFromSocket(socket))
        {
            return;
        }
        let cell = new GameCell(gameWorld, 0, 0);
        let user = new GameUser(socket, id);
        user.cells.push(cell);
        gameWorld.cellList.push(cell);
        user.sendCellList();
        users.push(user);
        console.log("registered a user");
    };
    messageResponses["input"] = (data, socket, id) => {
        let user = findUserFromId(id);
        if(user == null)
        {
            console.log("could not find user");
            return;
        }
        let targetX = readProp(data["x"], 0);
        let targetY = readProp(data["y"], 0);
        let doSplit = readProp(data["split"], false);
        for(let i = 0; i < user.cells.length; i++)
        {
            let cell = user.cells[i];
            cell.targetX = targetX;
            cell.targetY = targetY;
        }
        if(doSplit)
        {
            user.cells.sort((a, b) => { return a.mass - b.mass; }); //ascending
            for(let i = user.cells.length - 1; i >= 0; i--)
            {
                if(user.cells.length >= gameWorld.maxSplitCount)
                {
                    break;
                }
                let cell = user.cells[i];
                if(cell.mass < gameWorld.minSplitSize)
                {
                    continue;
                }
                let newCell = cell.split();
                user.cells.push(newCell);
                newCell.launch();
            }
            user.sendCellList();
        }
    };

    webapp = express();
    webapp.use(express.static("public"));
    webapp.listen(80, function() { console.log("webserver running"); })

    wsServer = new WebSocket.Server({
        port: 5524
    });
    wsServer.on("connection", (socket, req) => {
        var id = getNextAvailableId();
        console.log("received connection from " + req.connection.remoteAddress + ", id: " + id);
        socket.on("message", (dataStr) => {
            let dataObj = JSON.parse(dataStr);
            let actionName = dataObj.type;
            if(messageResponses.hasOwnProperty(actionName))
            {
                messageResponses[actionName](dataObj, socket, id);
            }
        });
        socket.on("close", (code, reason) => {
            let user = findUserFromId(id);
            if(user == null)
            {
                console.log("an unregistered user disconnected");
            }
            else
            {
                //remove user's cells from world
                for(let i = 0; i < user.cells.length; i++)
                {
                    let cell = user.cells[i];
                    gameWorld.cellList.splice(gameWorld.cellList.indexOf(cell), 1);
                }
                
                console.log("user id " + id + " disconnected" + ((reason != null && reason != "") ? (" (" + reason + ")") : ""));
                users.splice(users.indexOf(user), 1);
            }
        });
    });
}

main();