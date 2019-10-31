var GameCell = require("./public/cell.js");
var userState = {
    STARTING: 0,
    PLAYING: 1,
    DEAD: 2
};
class GameUser
{
    constructor(world, socket, id)
    {
        this.gameWorld = world;
        this.socket = socket;
        this.cells = [];
        this.id = id;
        this.state = userState.STARTING;
        this.respawnTimeout = -1;
        let thisUser = this;
        this.gameWorld.emitter.on("removeEntity", (entity) => {
            if(thisUser.cells.length == 0)
            {
                //we dead
                thisUser.state = userState.DEAD;
                //respawn
                if(this.respawnTimeout < 0)
                {
                    this.respawnTimeout = setTimeout(() => {
                        thisUser.respawn();
                    }, 1000);
                }
            }
        });
    }
    sendCellList()
    {
        let cellIds = [];
        for(let i = 0; i < this.cells.length; i++)
        {
            cellIds.push(this.cells[i].id);
        }
        this.socket.send(JSON.stringify({
            type: "youare",
            cellIds: cellIds
        }));
    }
    sendWorldSize()
    {
        this.socket.send(JSON.stringify({
            type: "worldSize",
            size: [this.gameWorld.width, this.gameWorld.height]
        }));
    }
    close()
    {
        for(let i = 0; i < this.cells.length; i++)
        {
            let cell = this.cells[i];
            this.gameWorld.cellList.splice(this.gameWorld.cellList.indexOf(cell), 1);
            this.gameWorld.removeEntity(cell);
        }
    }
    respawn()
    {
        let x = Math.random() * this.gameWorld.width;
        let y = Math.random() * this.gameWorld.height;
        let cell = new GameCell(this.gameWorld, x, y);
        this.cells = cell.group;
        this.sendCellList();
        this.state = userState.PLAYING;
        this.respawnTimeout = -1;
    }
    split()
    {
        this.cells.sort((a, b) => { return a.mass - b.mass; }); //ascending
        for(let i = this.cells.length - 1; i >= 0; i--)
        {
            if(this.cells.length >= this.gameWorld.maxSplitCount)
            {
                break;
            }
            let cell = this.cells[i];
            if(cell.mass < this.gameWorld.minSplitSize)
            {
                continue;
            }
            let newCell = cell.split();
            newCell.launch();
        }
        this.sendCellList();
    }
    shoot()
    {
        for(let i = this.cells.length - 1; i >= 0; i--)
        {
            let cell = this.cells[i];
            if(cell.mass > this.gameWorld.minShootSize)
            {
                cell.shoot();
            }
        }
    }
}
module.exports = GameUser;