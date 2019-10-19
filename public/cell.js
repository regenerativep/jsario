function rectangleInRectangle(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2)
{
    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}
class GameCell
{
    constructor(world, x, y)
    {
        this.world = world;
        this.entityType = "cell";
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.id = world.requestEntityId();
        this.timeToRecombine = 0;
        this.changeMass(32);
        this.targetX = 0;
        this.targetY = 0;
        this.moveAcceleration = 1;
        this.launchAcceleration = 10;
        this.angle = 0;
        this.group = [this];
        var thisCell = this;
        this._update = () => { thisCell.update(); };
        this.world.emitter.on("update", this._update);
        this.world.addEntity(this, "id", "x", "y", "mass", "radius");
        this.world.cellList.push(this);
    }
    addRecombineTime(mass)
    {
        this.timeToRecombine += mass * this.world.recombineTimeMultiplier;
    }
    changeMass(newMass)
    {
        let oldMass = this.mass * 1;
        if(isNaN(oldMass)) oldMass = 0;
        this.mass = newMass;
        this.addRecombineTime(this.mass - oldMass);
        this.radius = Math.sqrt(this.mass / Math.PI) * this.world.radiusMultiplier;
        this.maxSpeed = this.world.maxSpeedMultiplier / Math.pow(this.radius, 0.449);
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
        
        let dist = Math.sqrt((this.vx ** 2) + (this.vy ** 2));
        if(dist > this.maxSpeed)
        {
            uX = this.vx / dist;
            uY = this.vy / dist;
            if(dist > this.maxSpeed + this.world.friction)
            {
                this.apply(-uX * this.world.friction, -uY * this.world.friction);
            }
            else
            {
                this.vx = uX * this.maxSpeed;
                this.vy = uY * this.maxSpeed;
            }
        }
        let newX = this.x + this.vx;
        let newY = this.y + this.vy;
        if(newX < 0)
        {
            newX = 0;
            this.vx = 0;
        }
        if(newY < 0)
        {
            newY = 0;
            this.vy = 0;
        }
        if(newX > this.world.width)
        {
            newX = this.world.width;
            this.vx = 0;
        }
        if(newY > this.world.height)
        {
            newY = this.world.height;
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
                this.world.removeEntity(particle);
                this.changeMass(this.mass + this.world.foodGain);
            }
        }
        this.timeToRecombine--;
    }
    split()
    {
        let cell = new GameCell(this.world, this.x, this.y);
        let halfMass = this.mass / 2;
        this.changeMass(halfMass);
        cell.changeMass(halfMass);
        //cell.addRecombineTime(cell.mass);
        cell.vx = this.vx;
        cell.vy = this.vy;
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
        this.apply(uX * this.launchAcceleration, uY * this.launchAcceleration)
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
        this.group.splice(this.group.indexOf(this), 1);
        this.world.cellList.splice(this.world.cellList.indexOf(this), 1);
        this.world.emitter.removeListener("update", this._update);
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