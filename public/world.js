var lastCellId = 0;
function projectVectors(ax, ay, bx, by)
{
    let val = ((ax * bx) + (ay * by));// / (bx ** 2 + by ** 2)); //for what we are using it for, b is a unit vector
    return { x: bx * val, y: by * val };
}
class GameWorld
{
    constructor()
    {
        //todo calculate acceleration based on forces + mass, not acceleration itself
        this.cellList = [];
        this.friction = 1;
        this.cellularFriction = 0.1;
        this.maxSplitCount = 16;
        this.minSplitSize = 16;
        this.radiusMultiplier = 6;
        this.cellSpreadDivider = 1;
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
    }
    changeMass(newMass)
    {
        this.mass = newMass;
        this.radius = Math.sqrt(this.mass / Math.PI) * this.world.radiusMultiplier;
    }
    apply(mx, my)
    {
        this.mx += mx;// / this.mass;
        this.my += my;// / this.mass;
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
        GameWorld: GameWorld,
        GameCell: GameCell
    };
}
catch(e)
{
    //
}