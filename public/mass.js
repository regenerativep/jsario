class GameMass
{
    constructor(world, x, y, targetX, targetY)
    {
        this.world = world;
        this.entityType = "mass";
        this.mass = 14;
        this.radius = 12;
        this.sizeBasedFrictionCoefficient = Math.pow(this.radius, 0.449);
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.id = world.requestEntityId();
        this.targetX = targetX;
        this.targetY = targetY;
        this.graceTime = 10;
        this.launchAcceleration = 15;
        this.angle = 0;
        var thisMass = this;
        this._update = () => { thisMass.update(); };
        this.world.emitter.on("update", this._update);
        this.world.addEntity(this, "id", "x", "y", "mass", "radius");   
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
        if(newY + radius > this.world.height - radius)
        {
            newY = this.world.height;
            this.vy = 0;
        }
        this.changePosition(newX, newY);

        if(this.graceTime >= 0)
        {
            this.graceTime--;
        }
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
        let prevX = this.x, prevY = this.y;
        this.x = newX;
        this.y = newY;
        this.world.entityTree.moveItem(this, prevX, prevY);
        this.world.pushEntityUpdate(this, "x", "y");
    }
    close()
    {
        this.world.emitter.removeListener("update", this._update);
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