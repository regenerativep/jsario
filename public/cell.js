var GameMass = require("./mass.js");
function rectangleInRectangle(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)
{
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
function randomHuedColor()
{
    let which = Math.floor(Math.random() * 3);
    let other = Math.floor(Math.random() * 2) + 1;
    other = (which + other) % 3;
    let color = [0, 0, 0];
    color[which] = 255;
    color[other] = Math.floor(Math.random() * 256);
    return color;
}
class GameCell
{
    constructor(world, x, y, color)
    {
        this.world = world;
        this.entityType = "cell";
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.id = world.requestEntityId();
        this.timeToRecombine = 0;
        this.graceTime = 10;
        if(typeof color === "undefined")
        {
            this.color = randomHuedColor();
        }
        else
        {
            this.color = color;
        }
        this.changeMass(32);
        this.targetX = 0;
        this.targetY = 0;
        this.moveAcceleration = 0.6;
        this.launchAcceleration = 3;
        this.angle = 0;
        this.group = [this];
        var thisCell = this;
        this._update = () => { thisCell.update(); };
        this.world.emitter.on("update", this._update);
        this.world.addEntity(this, "id", "x", "y", "mass", "radius", "color");
        this.world.cellList.push(this);
    }
    setRecombineTime(mass)
    {
        this.timeToRecombine = 600 + Math.sqrt(mass) * this.world.recombineTimeMultiplier;
    }
    changeMass(newMass)
    {
        let oldMass = this.mass * 1;
        if(isNaN(oldMass)) oldMass = 0;
        this.mass = newMass;
        this.radius = Math.sqrt(this.mass / Math.PI) * this.world.radiusMultiplier;
        this.sizeBasedFrictionCoefficient = Math.pow(this.radius, 0.449);
        this.maxSpeed = this.world.maxSpeedMultiplier / this.sizeBasedFrictionCoefficient;
        this.world.pushEntityUpdate(this, "mass", "radius");
    }
    apply(vx, vy)
    {
        this.vx += vx;
        this.vy += vy;
    }
    update()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        this.apply(uX * this.moveAcceleration, uY * this.moveAcceleration);
        
        let distSqr = (this.vx ** 2) + (this.vy ** 2);
        let dist = Math.sqrt(distSqr);
        uX = this.vx / dist;
        uY = this.vy / dist;
        //calculate friction
        let fricMag = this.world.cellFrictionCoefficient * this.sizeBasedFrictionCoefficient * dist;
        if(dist > fricMag)
        {
            this.apply(-uX * fricMag, -uY * fricMag);
        }
        else
        {
            this.vx = 0;
            this.vy = 0;
        }
        let newX = this.x + this.vx;
        let newY = this.y + this.vy;
        let radius = this.radius
        if(newX - radius < 0)
        {
            newX = 0 + radius;
            this.vx = 0;
        }
        if(newY - radius < 0)
        {
            newY = 0 + radius;
            this.vy = 0;
        }
        if(newX + radius > this.world.width)
        {
            newX = this.world.width - radius;
            this.vx = 0;
        }
        if(newY + radius > this.world.height)
        {
            newY = this.world.height - radius;
            this.vy = 0;
        }
        this.changePosition(newX, newY);
        
        let cx1 = this.x - this.radius;
        let cy1 = this.y - this.radius;
        let cx2 = this.x + this.radius;
        let cy2 = this.y + this.radius;
        let nearbyFood = this.world.entityTree.getItemsIn((rx, ry, rw, rh) => {
            return rectangleInRectangle(cx1, cy1, cx2, cy2, rx, ry, rx + rw, ry + rh);
        });
        //get rid of anything that isnt food
        for(let j = nearbyFood.length - 1; j >= 0; j--)
        {
            let entity = nearbyFood[j];
            if(entity.entityType != "food")
            {
                nearbyFood.splice(j, 1);
            }
        }
        for(let j = 0; j < nearbyFood.length; j++)
        {
            let particle = nearbyFood[j];
            let foodDist = Math.sqrt((particle.x - this.x) ** 2 + (particle.y - this.y) ** 2);
            if(foodDist < this.world.foodRadius + this.radius)
            {
                //eat the food particle
                this.eat(particle);
            }
        }
        this.timeToRecombine--;
        if(this.graceTime >= 0)
        {
            this.graceTime--;
        }
    }
    split()
    {
        let cell = new GameCell(this.world, this.x, this.y, this.color);
        let halfMass = this.mass / 2;
        this.changeMass(halfMass);
        cell.changeMass(halfMass);
        cell.setRecombineTime(cell.mass);
        cell.vx = this.vx;
        cell.vy = this.vy;
        cell.targetX = this.targetX;
        cell.targetY = this.targetY;
        cell.group = this.group;
        this.group.push(cell);
        return cell;
    }
    shoot()
    {
        this.changeMass(this.mass - 18);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let mass = new GameMass(this.world, this.x, this.y, this.targetX, this.targetY);
        mass.x += uX * (this.radius - mass.radius);
        mass.y += uY * (this.radius - mass.radius);
        mass.launch();
        return mass;
    }
    launch()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let accel = this.launchAcceleration * Math.pow(this.radius, 0.7);
        this.apply(uX * accel, uY * accel)
        this.changePosition(this.x + this.vx, this.y + this.vy);
    }
    changePosition(newX, newY)
    {
        if(isNaN(newX) && !isNaN(this.x))
        {
            debugger;
        }
        
        let prevX = this.x, prevY = this.y;
        this.x = newX;
        this.y = newY;
        this.world.entityTree.moveItem(this, prevX, prevY);
        this.world.pushEntityUpdate(this, "x", "y");
    }
    close()
    {
        for(let i = this.group.length - 1; i >= 0; i--)
        {
            if(this.group[i].id == this.id)
            {
                this.group.splice(i, 1);
            }
        }
        for(let i = this.world.cellList.length - 1; i >= 0; i--)
        {
            if(this.world.cellList[i].id == this.id)
            {
                this.world.cellList.splice(i, 1);
            }
        }
        this.world.emitter.removeListener("update", this._update);
    }
    eat(target)
    {
        if(target.entityType == "cell")
        {
            this.changeMass(target.mass + this.mass);
            target.changeMass(0);
            this.world.removeEntity(target);
        }
        else if(target.entityType == "food")
        {
            this.world.removeEntity(target);
            this.changeMass(this.mass + this.world.foodGain);
        }
        else if(target.entityType == "mass")
        {
            this.changeMass(target.mass + this.mass);
            this.world.removeEntity(target);
        }
    }
}
try
{
    module.exports = GameCell;
}
catch(e)
{
    //
}