class GameMass
{
    constructor(world, x, y, targetX, targetY)
    {
        this.world = world;
        this.entityType = "mass";
        this.mass = 14;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.id = world.requestEntityId();
        this.targetX = targetX;
        this.targetY = targetY;
        this.launchAcceleration = 1.75;
        this.angle = 0;
        var thisMass = this;
        this._update = () => { thisMass.update(); };
        this.world.emitter.on("update", this._update);
        this.world.addEntity(this, "id", "x", "y", "mass");
        this.world.cellList.push(this);
    }
    apply(vx, vy)
    {
        this.vx += vx;
        this.vy += vy;
    }
    update()
    {
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let distSqr = (this.vx ** 2) + (this.vy ** 2);
        let dist = Math.sqrt(distSqr);
        uX = this.vx / dist;
        uY = this.vy / dist;
        //calculate friction
        let fricMag = this.world.massFrictionCoefficient * this.sizeBasedFrictionCoefficient * dist;
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
    }
    launch()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let accel = this.launchAcceleration;
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
}
try
{
    module.exports = GameMass;
}
catch(e)
{
    //
}