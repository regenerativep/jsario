try
{
    if(typeof Quadtree === "undefined")
    {
        var Quadtree = require("./quadtree.js");
    }
    if(typeof EventEmitter === "undefined")
    {
        var EventEmitter = require("./eventemitter.js");
    }
    if(typeof GameCell === "undefined")
    {
        var GameCell = require("./cell.js");
    }
}
catch(e)
{
    //
}

function projectVectors(ax, ay, bx, by)
{
    let val = ((ax * bx) + (ay * by));// / (bx ** 2 + by ** 2)); //for what we are using it for, b is a unit vector
    return { x: bx * val, y: by * val };
}
class GameWorld
{
    constructor(width, height)
    {
        this.emitter = new EventEmitter();
        this.width = width;
        this.height = height;
        this.entityList = [];
        this.entityTree = new Quadtree(0, 0, width, height, null);
        this.cellList = [];
        this.friction = 1;
        this.cellularFriction = 0.02;
        this.maxSplitCount = 16;
        this.minSplitSize = 16;
        this.radiusMultiplier = 6;
        this.cellSpreadDivider = 1;
        this.foodGain = 1;
        this.foodRadius = 2;
        this.foodAccumulateRate = 0.5;
        this.foodToPlace = 0;
        this.lastEntityId = 0;
        this.entityTypes = { //what variables in the entity to keep track of //todo: centralize this
            cell: ["entityType", "id", "x", "y", "mass", "radius"],
            food: ["entityType", "id", "x", "y"]
        };
        this.queuedEntityData = {};
        this.queuedEntityDataOrder = [];
    }
    pushEntityUpdate(entity, ...properties)
    {
        let updateSlot;
        if(this.queuedEntityData.hasOwnProperty(entity.id))
        {
            updateSlot = this.queuedEntityData[entity.id];
        }
        else
        {
            updateSlot = {};
            this.queuedEntityData[entity.id] = updateSlot;
        }
        if(properties.indexOf("id") < 0)
        {
            properties.push("id");
        }
        for(let i = 0; i < properties.length; i++)
        {
            let property = properties[i];
            updateSlot[property] = entity[property];
        }
        this.queuedEntityDataOrder.push(entity.id);
    }
    dequeueEntityUpdate()
    {
        if(this.queuedEntityDataOrder.length == 0) return null;
        let nextId = this.queuedEntityDataOrder.shift();
        if(this.queuedEntityData.hasOwnProperty(nextId))
        {
            let data = this.queuedEntityData[nextId];
            delete this.queuedEntityData[nextId];
            return data;
        }
        else
        {
            return this.dequeueEntityUpdate();
        }
    }
    getAllEntityData()
    {
        let allData = [];
        for(let i = 0; i < this.entityList.length; i++)
        {
            let entityData = {};
            let entity = this.entityList[i];
            let propertyList = this.entityTypes[entity.entityType];
            for(let j = 0; j < propertyList.length; j++)
            {
                let property = propertyList[j];
                entityData[property] = entity[property];
            }
            allData.push(entityData);
        }
        return allData;
    }
    requestEntityId() //may want to complicate this later
    {
        return this.lastEntityId++;
    }
    addEntity(entity, ...properties)
    {
        this.entityList.push(entity);
        this.entityTree.addItem(entity);
        this.emitter.emit("createEntity", entity, ...properties);
    }
    removeEntity(entity)
    {
        this.entityList.splice(this.entityList.indexOf(entity), 1);
        this.entityTree.removeItem(entity);
        this.emitter.emit("removeEntity", entity);
        if(typeof entity.close === "function")
        {
            entity.close();
        }
    }
    findEntityFromId(id)
    {
        for(let i = 0; i < this.entityList.length; i++)
        {
            let entity = this.entityList[i];
            if(entity.id == id)
            {
                return entity;
            }
        }
        return null;
    }
    update()
    {
        for(let i = 0; i < this.cellList.length; i++)
        {
            for(let j = i + 1; j < this.cellList.length; j++)
            {
                let aCell = this.cellList[i];
                let bCell = this.cellList[j];
                if(aCell.group == bCell.group)
                {
                    let distX = bCell.x - aCell.x;
                    let distY = bCell.y - aCell.y;
                    let distSqr = distX ** 2 + distY ** 2;
                    if(distSqr < (aCell.radius + bCell.radius) ** 2)
                    {
                        let dist = Math.sqrt(distSqr);
                        let uX = distX / dist;
                        let uY = distY / dist;
                        let distd2 = (aCell.radius + bCell.radius - dist) / (2 * this.cellSpreadDivider);
                        aCell.x -= uX * distd2;
                        aCell.y -= uY * distd2;
                        bCell.x += uX * distd2;
                        bCell.y += uY * distd2;
                        
                        let dvx = bCell.vx - aCell.vx;
                        let dvy = bCell.vy - aCell.vy;
                        //perpendicular
                        let pX = uY;
                        let pY = -uX;
                        let proj = projectVectors(dvx, dvy, pX, pY);
                        let mag = Math.sqrt(proj.x ** 2 + proj.y ** 2);
                        if(mag > this.cellularFriction)
                        {
                            mag = this.cellularFriction;
                        }
                        aCell.apply(-pX * mag, -pY * mag);
                        bCell.apply(pX * mag, pY * mag);
                    }
                }
            }
        }
        this.foodToPlace += this.foodAccumulateRate;
        while(this.foodToPlace > 1)
        {
            let x = Math.random() * this.width;
            let y = Math.random() * this.height;
            this.addEntity({
                entityType: "food",
                x: x,
                y: y,
                id: this.requestEntityId()
            }, "id", "x", "y");
            this.foodToPlace--;
        }
        this.emitter.emit("update");
    }
}


try
{
    module.exports = {
        GameWorld,
        GameCell
    };
}
catch(e)
{
    //
}