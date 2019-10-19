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
        this.mx = 0;
        this.my = 0;
        this.id = world.requestEntityId();
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
        this._update = () => { thisCell.update(); };
        this.world.emitter.on("update", this._update);
        this.world.addEntity(this, "id", "x", "y", "mass", "radius");
        this.world.cellList.push(this);
    }
    changeMass(newMass)
    {
        this.mass = newMass;
        this.radius = Math.sqrt(this.mass / Math.PI) * this.world.radiusMultiplier;
        this.world.pushEntityUpdate(this, "mass");
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
        this.changePosition(this.x + this.vx, this.y + this.vy);
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
        let nearbyFood = this.world.entityTree.getItemsIn((rx, ry, rw, rh) => {
            return rectangleInRectangle(cx1, cy1, cx2, cy2, rx, ry, rx + rw, ry + rh);
        });
        //get rid of anything that isnt food
        for(let j = nearbyFood.length - 1; j >= 0; j--)
        {
            let entity = nearbyFood[j];
            if(entity.type != "food")
            {
                nearbyFood.splice(j, 1);
            }
        }
        let foodRadiusSqr = this.world.foodRadius ** 2;
        for(let j = 0; j < nearbyFood.length; j++)
        {
            let particle = nearbyFood[j];
            let distSqr = (particle.x - this.x) ** 2 + (particle.y - this.y) ** 2;
            if(distSqr < foodRadiusSqr + this.radius ** 2)
            {
                //eat the food particle
                this.world.removeEntity(particle);
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
        this.changePosition(this.x + this.vx, this.y + this.vy);
    }
    changePosition(newX, newY)
    {
        let prevX = this.x, prevY = this.y;
        this.x = newX;
        this.y = newY;
        this.world.entityTree.moveItem(this, prevX, prevY);
        this.world.pushEntityUpdate(this, "x", "y");
    }
    close()
    {
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