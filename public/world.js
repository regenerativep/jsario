var lastCellId = 0;
class GameWorld
{
    constructor()
    {
        this.cellList = [];
        this.friction = 0.1;
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
    }
    update()
    {
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