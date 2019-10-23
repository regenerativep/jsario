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
function rectangleInRectangle(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)
{
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
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
        this.cellFrictionCoefficient = 0.04;
        this.maxSplitCount = 16;
        this.minSplitSize = 16;
        this.radiusMultiplier = 6;
        this.maxSpeedMultiplier = 6;
        this.recombineTimeMultiplier = 2;
        this.cellSpreadDivider = 1;
        this.minimumCellEatRatio = 1.25;
        this.foodGain = 1;
        this.foodRadius = 2;
        this.foodAccumulateRate = 0.5;
        this.foodToPlace = 0;
        this.lastEntityId = 0;
        this.freeIds = [];
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
    requestEntityId()
    {
        if(this.freeIds.length > 0)
        {
            return this.freeIds.splice(0, 1)[0];
        }
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
        this.freeIds.push(entity.id);
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
        let checkedPairs = {};
        function getPairChecked(cellA, cellB)
        {
            //return false; //is bad, just do every check
            function checkPair(str)
            {
                if(checkedPairs.hasOwnProperty(str))
                {
                    return true;
                }
            }
            let cellAstr = cellA.id.toString();
            let cellBstr = cellB.id.toString();
            return checkPair(cellAstr + "-" + cellBstr) || checkPair(cellBstr + "-" + cellAstr);
        }
        function setPairChecked(cellA, cellB)
        { 
            let cellAstr = cellA.id.toString();
            let cellBstr = cellB.id.toString();
            checkedPairs[cellAstr + "-" + cellBstr] = 1;
        }
        this.cellList = this.cellList.sort((a, b) => { return b.mass - a.mass; }); //descending
        for(let i = 0; i < this.cellList.length; i++)
        {
            let cell = this.cellList[i];
            let checkRadius = cell.radius * 2; //do this to get around a certain issue with the tree that we should todo: fix
            let cx1 = cell.x - checkRadius;
            let cy1 = cell.y - checkRadius;
            let cx2 = cell.x + checkRadius;
            let cy2 = cell.y + checkRadius;
            let nearbyCells = this.entityTree.getItemsIn((rx, ry, rw, rh) => {
                return rectangleInRectangle(cx1, cy1, cx2, cy2, rx, ry, rx + rw, ry + rh);
            });
            for(let j = nearbyCells.length - 1; j >= 0; j--)
            {
                let entity = nearbyCells[j];
                if(entity.entityType != "cell")
                {
                    nearbyCells.splice(j, 1);
                }
            }
            for(let j = nearbyCells.length - 1; j >= 0; j--)
            {
                let otherCell = nearbyCells[j];
                if(cell == otherCell || cell.mass <= 0 || otherCell.mass <= 0 || getPairChecked(cell, otherCell) || cell.gracePeriod <= 0 || otherCell.gracePeriod <= 0)
                {
                    continue;
                }
                let aCell = cell, bCell = otherCell;
                let distX = (bCell.x + bCell.vx) - (aCell.x + aCell.vx);
                let distY = (bCell.y + bCell.vy) - (aCell.y + aCell.vy);
                let dist = Math.sqrt(distX ** 2 + distY ** 2); //todo: use sqrt sparingly
                let largestCell, smallCell;
                if(aCell.radius > bCell.radius)
                {
                    largestCell = aCell;
                    smallCell = bCell;
                }
                else
                {
                    largestCell = bCell;
                    smallCell = aCell;
                }
                if(cell.group != otherCell.group)
                {
                    //this is an enemy cell. see if we can eat it
                    if(smallCell.mass * this.minimumCellEatRatio < largestCell.mass)
                    {
                        //we can eat it
                        if(dist < largestCell.radius)
                        {
                            //eat it
                            largestCell.eat(smallCell);
                        }
                    }
                }
                else
                {
                    if(aCell.timeToRecombine <= 0 && bCell.timeToRecombine <= 0)
                    {
                        if(dist < largestCell.radius)
                        {
                            largestCell.eat(smallCell);
                        }
                    }
                    else
                    {
                        if(dist < aCell.radius + bCell.radius)
                        {
                            if(dist == 0) dist = 1; //prevent div by 0
                            let uX = distX / dist;
                            let uY = distY / dist;
                            let distd2 = (aCell.radius + bCell.radius - dist) / (2 * this.cellSpreadDivider);
                            aCell.changePosition(aCell.x - uX * distd2, aCell.y - uY * distd2);
                            bCell.changePosition(bCell.x + uX * distd2, bCell.y + uY * distd2);
                        }
                    }
                }
                setPairChecked(cell, otherCell);
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