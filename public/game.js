class Cell
{
    constructor(x,y,r,mass,id)
    {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = r;
        this.mass = mass;
        this.type = "cell";
    }
    /*move() //currently not in use
    {
        var angle = Math.atan2(mouseY-halfHeight,mouseX-halfWidth);
        this.vx = Math.cos(angle)*Math.min(1,(Math.abs(mouseX-halfWidth)/20));
        this.vy = Math.sin(angle)*Math.min(1,(Math.abs(mouseY-halfHeight)/20));
        this.x += this.vx;
        this.y += this.vy;
    }*/
    draw()
    {
        ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    }
}
class Camera
{
    constructor()
    {
        this.camX = 0;
        this.camY = 0;
    }
    track(c)
    {
        this.camX = 0;
        this.camY = 0;

        let cells = [];
        for(let i = 0; i < c.localIds.length; i++)
        {
            let cell = c.findEntityFromId(c.localIds[i]);
            if(cell!=null)
            {
                cells.push(cell);
            }
        }
        for(let i = 0; i < cells.length; i++)
        {
            let cell = cells[i];
            this.camX += cell.x;
            this.camY += cell.y;
        }

        this.camX = this.camX/cells.length - halfWidth;
        this.camY = this.camY/cells.length - halfHeight;
        translate(-this.camX,-this.camY);
        if(showDebug)
        {
            drawQuadtree(client.foodTree);
            for(let i = 0; i < cells.length; i++)
            {
                let cell = cells[i];
                let cx1 = cell.x - cell.radius;
                let cy1 = cell.y - cell.radius;
                let cx2 = cell.x + cell.radius;
                let cy2 = cell.y + cell.radius;
                let nearbyFood = client.foodTree.getItemsIn((rx, ry, rw, rh) => {
                    return rectangleInRectangle(cx1, cy1, cx2, cy2, rx, ry, rx + rw, ry + rh);
                });
                for(let j = 0; j < nearbyFood.length; j++)
                {
                    let particle = nearbyFood[j];
                    stroke(255, 0, 0);
                    line(cell.x, cell.y, particle.x, particle.y);
                }
            }
        }
    }
}
class Client
{
    constructor(camera)
    {
        this.localIds = [];
        this.entityList = {};
        this.foodTree = new Quadtree(0, 0, 2048, 2048); //todo: possibly let server tell us room size
        this.webSock = null;
        this.camera = camera;
    }
    setSocket(webSock)
    {
        this.webSock = webSock;
    }
    findEntityFromId(id)
    {
        return (this.entityList[id]);
    }
    sendInput()
    {
        let doSplit = spacePressed && !lastSpacePressed;
        this.webSock.send(JSON.stringify({
            type: "input",
            x: this.camera.camX + mouseX,
            y: this.camera.camY + mouseY,
            split: doSplit
        }));
        
    }
    receiveMyCells(ids)
    {
        this.localIds = ids;
    }
    //here we have to process the list of json objects and turn them into an actual cell list
    //is this the best way to do this, or should we update the cells in the current list instead of essentially overwriting every time?
    createEntity(e) 
    {
        if(e.entityType=="cell")
        {
            this.entityList[e.id] = new Cell(e.x,e.y,e.radius,e.mass,e.id);
        }
        else if(e.entityType=="food")
        {
            this.entityList[e.id] = {x: e.x, y: e.y, id: e.id, type: "food"}
        }
        
    }
    updateEntity(e)
    {
        /*
        if(!this.entityList.hasOwnProperty(e.id))
        {
            if(e.entityType=="cell")
            {
                this.entityList[e.id] = new Cell(e.x,e.y,e.radius,e.mass,e.id);
            }
            else if(e.entityType=="food"){}
        }*/
        if(this.entityList.hasOwnProperty(e.id))
        {
            let entity = this.entityList[e.id];
            for(let key in e)
            {
                entity[key] = e[key];
            }
        }
    }
    removeEntity(id)
    {
        delete this.entityList[id];
    }
    updateEntities()
    {
        this.sendInput();
        for(let key in this.entityList)
        {
            let ent = this.entityList[key];
            if(ent.type=="cell")
            {
                ent.draw();
            }
            else if(ent.type=="food")
            {
                ellipse(ent.x, ent.y, foodRadius * 2, foodRadius * 2);
            }
        }
    }
}
var showDebug = false;
var halfWidth, halfHeight;
var cam = new Camera();
var client = new Client(cam);
var connected = false;
var ws = new WebSocket("ws://127.0.0.1:5524");
var spacePressed, lastSpacePressed;
var foodRadius = 4;
ws.onopen = function() {
    console.log("connected");
    ws.send(JSON.stringify({
        type: "register"
    }));
    connected = true;
    client.setSocket(ws);
};
ws.onclose = function() {
    console.log("disconnected");
    connected = false;
}
ws.onmessage = function(ev) {
    let data = JSON.parse(ev.data);
    if (data.type == "youare")
    {
        client.receiveMyCells(data.cellIds);
    }
    else if(data.type == "createEntity")
    {
        client.createEntity(data);
    }
    else if(data.type == "updateEntities")
    {
        for(let i = 0; i < data.entities.length; i++)
        {
            let entityData = data.entities[i];
            client.updateEntity(entityData);
        }
    }
    else if(data.type == "removeEntity")
    {
        client.removeEntity(data.id);
    }
};
function zaggyLine(x,y,l, wid)
{
    let currX = x;
    let currY = y;
    let up = false;
    while(currX < x + width + l + wid)
    {
        let nextX = currX + l/2 * Math.sqrt(3);
        let nextY = (up) ? currY + l/2 : currY - l/2 ;
        stroke(50,50,50);
        strokeWeight(2);
        line(currX,currY,nextX,nextY);
        currX = nextX;
        currY = nextY;
        if(up)
        {
            line(currX,currY,currX,currY+l);
        }
        up = !up;
    }
}
function hexTile(camera)
{
    let len = 30;
    let wid = len/2*Math.sqrt(3);
    let x = camera.camX - camera.camX % (wid * 2) - wid * 4;
    let y = camera.camY - camera.camY % (len * 3) - len * 1.5;
    //let offset = ((camera.camX - camera.camX % (wid))/(wid)) % 2 == 0 ? false:true;
    let offset = false;

    for(let i = y; i < y + height + (len * 3); i += len*1.5)
    {
        zaggyLine(x + (offset ? wid : 0),i,len, wid * 4);
        offset = !offset;
    }
}
function drawQuadtree(tree)
{
    stroke(0, 0, 255);
    noFill();
    rect(tree.x, tree.y, tree.width, tree.height);
    if(tree.children != null)
    {
        for(let i = 0; i < tree.children.length; i++)
        {
            drawQuadtree(tree.children[i]);
        }
    }
    if(tree.triggered)
    {
        noStroke();
        fill(0, 255, 0, 102);
        rect(tree.x, tree.y, tree.width, tree.height);
    }
    fill(255);
    stroke(0);
}
function setup()
{
    createCanvas(1024, 768);
    halfWidth = width / 2;
    halfHeight = height / 2;
}
function draw()
{
    background(0);
    if(connected)
    {
        cam.track(client);
        hexTile(cam);
        client.updateEntities();
    }
    rect(64,64,64,64);

    lastSpacePressed = spacePressed;
}
function keyPressed()
{
    if(key == ' ')
    {
        spacePressed = true;
    }
}
function keyReleased()
{
    if(key == ' ')
    {
        spacePressed = false;
    }
}