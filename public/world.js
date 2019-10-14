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
    }
    update()
    {
        let angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(angle);
        let uY = Math.sin(angle);
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
            let dist = Math.sqrt(dist);
            this.vx = (this.vx / dist) * this.maxSpeed;
            this.vy = (this.vy / dist) * this.maxSpeed;
        }
        this.x += this.vx;
        this.y += this.vy;
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