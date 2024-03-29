var Server = require("ws").Server;
var wrldJs = require("./public/world.js");
var GameWorld = wrldJs.GameWorld, GameCell = wrldJs.GameCell;
var GameUser = require("./user.js");
var WebServer = require("./webserver.js")();
var EventEmitter = require("./public/eventemitter.js");

var webapp, wsServer, gameWorld;
var gameUpdateInterval, clientUpdateInterval;
var messageResponses = {};

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
function broadcast(data)
{
    for(let i = 0; i < users.length; i++)
    {
        let user = users[i];
        user.socket.send(JSON.stringify(data));
    }
}
function updateClients()
{
    let entityDataList = [];
    let entityData = gameWorld.dequeueEntityUpdate();
    while(entityData != null)
    {
        entityDataList.push(entityData);
        entityData = gameWorld.dequeueEntityUpdate();
    }
    if(entityDataList.length > 0)
    {
        broadcast({
            type: "updateEntities",
            entities: entityDataList
        });
    }
}
function main()
{
    gameWorld = new GameWorld(4096, 4096);
    gameWorld.emitter.on("createEntity", (entity, ...properties) => {
        let data = {
            type: "createEntity",
            entityType: entity["entityType"]
        };
        for(let i = 0; i < properties.length; i++)
        {
            let property = properties[i];
            data[property] = entity[property];
        }
        broadcast(data);
    });
    gameWorld.emitter.on("removeEntity", (entity) => {
        let data = {
            type: "removeEntity",
            id: entity["id"]
        };
        broadcast(data);
    });
    gameUpdateInterval = setInterval(() => {
        gameWorld.update();
    }, 1000 / 60);
    clientUpdateInterval = setInterval(updateClients, 1000 / 60);

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
        let user = new GameUser(gameWorld, socket, id);
        user.respawn();
        //we need to catch the user up with all of the already existing entities
        let allEntityData = gameWorld.getAllEntityData();
        for(let i = 0; i < allEntityData.length; i++)
        {
            let entityData = allEntityData[i];
            entityData["type"] = "createEntity";
            socket.send(JSON.stringify(entityData));
        }
        user.sendWorldSize();
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
        let doShoot = readProp(data["shoot"], false);
        for(let i = 0; i < user.cells.length; i++)
        {
            let cell = user.cells[i];
            cell.targetX = targetX;
            cell.targetY = targetY;
        }
        if(doSplit)
        {
            user.split();
        }
        if(doShoot)
        {
            user.shoot();
        }
    };
    wsServer = new Server({
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
                user.close();
                console.log("user id " + id + " disconnected" + ((reason != null && reason != "") ? (" (" + reason + ")") : ""));
                users.splice(users.indexOf(user), 1);
            }
        });
    });
    wsServer.on("error", (err) => {
        console.log("something went wrong when creating websocket server")
        console.log(err);
    });
}

main();