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
        this.entityTypes = { //what variables in the entity to keep track of
            cell: ["type", "id", "x", "y", "vx", "vy", "mass", "radius"],
            food: ["type", "x", "y", "id"],
            world: ["type", "width", "height"]
        };
        this.queuedEntityData = {};
        this.queuedEntityDataOrder = [];
    }
    pushEntityUpdate(entity)
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
        for(let i = 1; i < arguments.length; i++)
        {
            let property = arguments[i];
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
    requestEntityId() //may want to complicate this later
    {
        return lastEntityId++;
    }
    addEntity(entity)
    {
        
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
    createFood(x, y)
    {
        let particle = {
            type: "cell",
            x: x,
            y: y,
            id: lastFoodId++
        };
        this.foodTree.addItem(particle);
        this.emitter.emit("createFood", particle);
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
            this.createFood(x, y);
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