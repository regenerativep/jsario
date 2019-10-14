var lastCellId = 0;
class GameWorld
{
    constructor()
    {
        this.cellList = [];
        this.friction = 0.4;
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
    update()
    {
        for(let i = 0; i < this.cellList.length; i++)
        {
            this.cellList[i].update();
        }
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
        this.id = lastCellId++;
        this.mass = 32;
        this.targetX = 0;
        this.targetY = 0;
        this.maxAcceleration = 1;
        this.maxSpeed = 4;
        this.speedDecelerationWhenMax = 0.5;
        this.launchSpeed = 8;
        this.angle = 0;
    }
    update()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let magnitude = this.maxAcceleration; //may want to change in future
        this.vx += uX * magnitude;
        this.vy += uY * magnitude;

        //todo make friction directional, not axis-based
        let vSign = Math.sign(this.vx);
        if(this.vx * vSign > this.world.friction)
        {
            this.vx -= this.world.friction * vSign;
        }
        else
        {
            this.vx = 0;
        }
        vSign = Math.sign(this.vy);
        if(this.vy * vSign > this.world.friction)
        {
            this.vy -= this.world.friction * vSign;
        }
        else
        {
            this.vy = 0;
        }
        let distSqr = (this.vx ** 2) + (this.vy ** 2);
        if(distSqr > this.maxSpeed ** 2)
        {
            let dist = Math.sqrt(distSqr);
            if(dist < this.maxSpeed + this.speedDecelerationWhenMax)
            {
                this.vx = (this.vx / dist) * this.maxSpeed;
                this.vy = (this.vy / dist) * this.maxSpeed;
            }
            else
            {
                uX = this.vx / dist;
                uY = this.vy / dist;
                this.vx -= uX * this.speedDecelerationWhenMax;
                this.vy -= uY * this.speedDecelerationWhenMax;
            }
        }
        this.x += this.vx;
        this.y += this.vy;
    }
    split()
    {
        let cell = new GameCell(this.world, this.x, this.y);
        let halfMass = this.mass / 2;
        this.mass = halfMass;
        cell.mass = halfMass;
        cell.vx = this.vx;
        cell.vy = this.vy;
        cell.targetX = this.targetX;
        cell.targetY = this.targetY;
        cell.launch();
        return cell;
    }
    launch()
    {
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        this.vx += uX * this.launchSpeed;
        this.vy += uY * this.launchSpeed;
    }
}

try
{
    module.exports = {
        GameWorld: GameWorld,
        GameCell: GameCell
    };
}
catch(e)
{
    //
}