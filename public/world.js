//import { EventEmitter } from "events";
var EventEmitter;
/*try
{
    EventEmitter = require("events").EventEmitter;
}
catch(e)
{*/
    //we're running in browser
    //nevermind we dont care. we're using our own
    EventEmitter = class EventEmitter
    {
        constructor()
        {
            this.events = {};
            this.addEventListener = this.on;
        }
        on(name, action)
        {
            if(this.events.hasOwnProperty(name))
            {
                this.events[name].push(action);
            }
            else
            {
                this.events[name] = [action];
            }
        }
        emit(name)
        {
            if(!this.events.hasOwnProperty(name))
            {
                return;
            }
            let args = [];
            for(let i = 1; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }
            let event = this.events[name];
            for(let i = 0; i < event.length; i++)
            {
                let listener = event[i];
                listener(...args);
            }
        }
    }
//}

var lastCellId = 0;
var lastFoodId = 0;
function projectVectors(ax, ay, bx, by)
{
    let val = ((ax * bx) + (ay * by));// / (bx ** 2 + by ** 2)); //for what we are using it for, b is a unit vector
    return { x: bx * val, y: by * val };
}
function rectangleInRectangle(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)
{
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
class Quadtree
{
    constructor(x, y, width, height, parent)
    {
        this.parent = parent;
        if(parent == null)
        {
            this.depth = 0;
        }
        else
        {
            this.depth = parent.depth + 1;
        }
        this.children = null;
        this.item = null;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.widd2 = x + width / 2;
        this.hgtd2 = y + height / 2;
        this.maxDepth = 32;
        this.triggered = false;
    }
    addItem(item)
    {
        if(this.item != null)
        {
            this.split();
        }
        if(this.children != null)
        {
            let child = 0;
            child |= item.x > this.widd2 ? 1 : 0;
            child |= item.y > this.hgtd2 ? 2 : 0;
            this.children[child].addItem(item);
        }
        else if(this.item == null)
        {
            this.item = item;
        }
    }
    getItemsIn(cond)
    {
        this.triggered = false;
        if(cond(this.x, this.y, this.width, this.height))
        {
            if(this.children == null)
            {
                this.triggered = true;
                if(this.item == null)
                {
                    return [];
                }
                else
                {
                    return [this.item];
                }
            }
            else
            {
                let items = [];
                for(let i = 0; i < this.children.length; i++)
                {
                    items.push(...this.children[i].getItemsIn(cond));
                }
                return items;
            }
            
        }
        return [];
    }
    removeItem(item)
    {
        if(this.item == null)
        {
            if(this.children != null)
            {
                let child = 0;
                if(item.x > this.widd2)
                {
                    if(item.y > this.hgtd2)
                    {
                        child = 3;
                    }
                    else
                    {
                        child = 1;
                    }
                }
                else if(item.y > this.hgtd2)
                {
                    child = 2;
                }
                this.children[child].removeItem(item);
            }
        }
        else
        {
            this.item = null;
        }
    }
    split()
    {
        if(this.depth >= this.maxDepth)
        {
            //return;
        }
        this.children = [];
        let wd2 = this.width / 2;
        let hd2 = this.height / 2;
        this.children[0] = new Quadtree(this.x, this.y, wd2, hd2, this);
        this.children[1] = new Quadtree(this.x + wd2, this.y, wd2, hd2, this);
        this.children[2] = new Quadtree(this.x, this.y + hd2, wd2, hd2, this);
        this.children[3] = new Quadtree(this.x + wd2, this.y + hd2, wd2, hd2, this);
        let item = this.item;
        this.item = null;
        this.addItem(item);
    }
}
class GameWorld
{
    constructor(width, height)
    {
        this.emitter = new EventEmitter();
        this.width = width;
        this.height = height;
        this.cellList = [];
        this.foodTree = new Quadtree(0, 0, width, height, null);
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
class GameCell
{
    constructor(world, x, y)
    {
        this.world = world;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.mx = 0;
        this.my = 0;
        this.id = lastCellId++;
        this.changeMass(32);
        this.targetX = 0;
        this.targetY = 0;
        this.maxMomentum = 3;
        this.maxImpulse = 30;
        this.impulseWhenMax = 1;
        this.launchImpulse = 50;
        this.angle = 0;
        this.group = [];
        var thisCell = this;
        this.world.emitter.on("update", () => { thisCell.update(); }); //todo: remove this listener on destroy
        this.world.emitter.emit("createCell", this);
    }
    changeMass(newMass)
    {
        this.mass = newMass;
        this.radius = Math.sqrt(this.mass / Math.PI) * this.world.radiusMultiplier;
    }
    apply(mx, my)
    {
        this.mx += mx;
        this.my += my;
    }
    update()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let magnitude = this.maxMomentum; //may want to change in future
        this.apply(uX * magnitude, uY * magnitude);

        let distSqr = (this.mx ** 2) + (this.my ** 2);
        let dist = null;
        if(distSqr > this.world.friction ** 2)
        {
            let dist = Math.sqrt(distSqr);
            uX = this.mx / dist;
            uY = this.my / dist;
            this.apply(-uX * this.world.friction, -uY * this.world.friction);
        }
        else
        {
            this.mx = 0;
            this.my = 0;
        }
        if(distSqr > this.maxImpulse ** 2)
        {
            if(dist == null)
            {
                dist = Math.sqrt(distSqr);
            }
            if(dist < this.maxImpulse + this.impulseWhenMax)
            {
                this.mx = (this.mx / dist) * this.maxImpulse;
                this.my = (this.my / dist) * this.maxImpulse;
            }
            else
            {
                uX = this.mx / dist;
                uY = this.my / dist;
                this.apply(-uX * this.impulseWhenMax, -uY * this.impulseWhenMax);
            }
        }
        this.vx = this.mx / this.mass;
        this.vy = this.my / this.mass;
        this.x += this.vx;
        this.y += this.vy;
        if(this.x < 0)
        {
            this.x = 0;
            this.mx = 0;
        }
        if(this.y < 0)
        {
            this.y = 0;
            this.my = 0;
        }
        if(this.x > this.world.width)
        {
            this.x = this.world.width;
            this.mx = 0;
        }
        if(this.y > this.world.height)
        {
            this.y = this.world.height;
            this.my = 0;
        }
        
        let cx1 = this.x - this.radius;
        let cy1 = this.y - this.radius;
        let cx2 = this.x + this.radius;
        let cy2 = this.y + this.radius;
        let nearbyFood = this.world.foodTree.getItemsIn((rx, ry, rw, rh) => {
            return rectangleInRectangle(cx1, cy1, cx2, cy2, rx, ry, rx + rw, ry + rh);
        });
        let foodRadiusSqr = this.world.foodRadius ** 2;
        for(let j = 0; j < nearbyFood.length; j++)
        {
            let particle = nearbyFood[j];
            let distSqr = (particle.x - this.x) ** 2 + (particle.y - this.y) ** 2;
            if(distSqr < foodRadiusSqr + this.radius ** 2)
            {
                //eat the food particle
                this.world.foodTree.removeItem(particle);
                this.world.emitter.emit("removeFood", particle);
                this.changeMass(this.mass + this.world.foodGain);
            }
        }
    }
    split()
    {
        let cell = new GameCell(this.world, this.x, this.y);
        let halfMass = this.mass / 2;
        this.changeMass(halfMass);
        cell.changeMass(halfMass);
        cell.mx = this.mx;
        cell.my = this.my;
        cell.targetX = this.targetX;
        cell.targetY = this.targetY;
        cell.group = this.group;
        this.world.cellList.push(cell);
        this.group.push(cell);
        return cell;
    }
    launch()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        this.apply(uX * this.launchImpulse, uY * this.launchImpulse)
        this.x += this.mx;
        this.y += this.my;
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