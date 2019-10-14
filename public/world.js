var lastCellId = 0;
class GameWorld
{
    constructor()
    {
        //todo calculate acceleration based on forces + mass, not acceleration itself
        this.cellList = [];
        this.friction = 0.2;
        this.maxSplitCount = 16;
        this.cellRepelAcceleration = 1;
        this.radiusMultiplier = 6;
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
            for(let j = i + 1; j < this.cellList.length; j++)
            {
                let aCell = this.cellList[i];
                let bCell = this.cellList[j];
                /*
                let collide = false;
                for(let k = 0; k < aCell.group.length; k++)
                {
                    if(aCell.group[k] == bCell)
                    {
                        collide = true;
                    }
                }
                if(collide)*/
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
                        let aX = uX * this.cellRepelAcceleration;
                        let aY = uY * this.cellRepelAcceleration;
                        /*
                        aCell.vx -= aX;
                        aCell.vy -= aY;
                        bCell.vx += aX;
                        bCell.vy += aY;*/
                        let distd2 = (aCell.radius + bCell.radius - dist) / 2;
                        aCell.x -= uX * distd2;
                        aCell.y -= uY * distd2;
                        bCell.x += uX * distd2;
                        bCell.y += uY * distd2;
                    }
                }
            }
        }
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
        this.changeMass(32);
        this.targetX = 0;
        this.targetY = 0;
        this.maxAcceleration = 0.3;
        this.maxSpeed = 3;
        this.speedDecelerationWhenMax = 0.1;
        this.launchSpeed = 8;
        this.angle = 0;
        this.group = [];
    }
    changeMass(newMass)
    {
        this.mass = newMass;
        this.updateRadius();
    }
    updateRadius()
    {
        this.radius = Math.sqrt(this.mass / Math.PI) * this.world.radiusMultiplier;
    }
    update()
    {
        this.angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        let magnitude = this.maxAcceleration; //may want to change in future
        this.vx += uX * magnitude;
        this.vy += uY * magnitude;

        let distSqr = (this.vx ** 2) + (this.vy ** 2);
        let dist = null;
        if(distSqr > this.world.friction ** 2)
        {
            let dist = Math.sqrt(distSqr);
            uX = this.vx / dist;
            uY = this.vy / dist;
            this.vx -= uX * this.world.friction;
            this.vy -= uY * this.world.friction;
        }
        else
        {
            this.vx = 0;
            this.vy = 0;
        }
        if(distSqr > this.maxSpeed ** 2)
        {
            if(dist == null)
            {
                dist = Math.sqrt(distSqr);
            }
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
        this.changeMass(halfMass);
        cell.changeMass(halfMass);
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
        let uX = Math.cos(this.angle);
        let uY = Math.sin(this.angle);
        this.vx += uX * this.launchSpeed;
        this.vy += uY * this.launchSpeed;
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