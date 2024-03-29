class Cell
{
    constructor(x, y, radius, mass, id)
    {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = radius;
        this.mass = mass;
        this.type = "cell";
        this.circleGraphic = null;
        this.drawFromX = x - this.radius;
        this.drawFromY = y - this.radius;
    }
    updatedProperties(props)
    {
        for(let i = 0; i < props.length; i++)
        {
            let prop = props[i];
            if(prop == "radius")
            { 
                this.updateCircleGraphic();
            }
            else if(prop == "x")
            {
                this.drawFromX = this.x - this.radius;
            }
            else if(prop == "y")
            {
                this.drawFromY = this.y - this.radius;
            }
        }
    }
    updateCircleGraphic()
    {
        if(this.circleGraphic != null)
        {
            this.circleGraphic.remove();
        }
        let rad2 = this.radius * 2;
        this.circleGraphic = createGraphics(rad2, rad2);
        this.circleGraphic.background(0, 0);
        this.circleGraphic.fill(this.color[0], this.color[1], this.color[2]);
        this.circleGraphic.ellipse(this.radius, this.radius, rad2, rad2);
    }
    draw()
    {
        if(this.circleGraphic != null)
        {
            image(this.circleGraphic, this.drawFromX, this.drawFromY);
        }
    }
}
class Mass
{
    constructor(x, y, radius, mass, id)
    {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = radius;
        this.mass = mass;
        this.type = "mass";
        this.circleGraphic = null;
        this.drawFromX = x - this.radius;
        this.drawFromY = y - this.radius;
        this.updateCircleGraphic();
    }
    updatedProperties(props)
    {
        for(let i = 0; i < props.length; i++)
        {
            let prop = props[i];
            if(prop == "radius")
            { 
                this.updateCircleGraphic();
            }
            else if(prop == "x")
            {
                this.drawFromX = this.x - this.radius;
            }
            else if(prop == "y")
            {
                this.drawFromY = this.y - this.radius;
            }
        }
    }
    updateCircleGraphic()
    {
        if(this.circleGraphic != null)
        {
            this.circleGraphic.remove();
        }
        let rad2 = this.radius * 2;
        this.circleGraphic = createGraphics(rad2, rad2);
        this.circleGraphic.background(0, 0);
        this.circleGraphic.ellipse(this.radius, this.radius, rad2, rad2);
    }
    draw()
    {
        /*if(this.circleGraphic != null)
        {
            image(this.circleGraphic, this.drawFromX, this.drawFromY);
        }*/
        fill(255, 0, 0);
        ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    }
}
class Camera
{
    constructor()
    {
        this.camX = 0;
        this.camY = 0;
        this.scale = 1;
    }
    smoothTrack(c)
    {
        let prevX = this.camX;
        let prevY = this.camY;
        let destX = 0;
        let destY = 0;
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
            destX += cell.x;
            destY += cell.y;
            console.log(cell.x + "," + cell.y);
        }
        destX = (destX/cells.length)-halfWidth/this.scale;
        destY = (destY/cells.length)-halfHeight/this.scale;
        destX = (destX + prevX) / 2;
        destY = (destY + prevY) / 2;
        if(isNaN(destX))
        {
            destX = prevX;
        }
        if(isNaN(destY))
        {
            destY = prevX;
        }
        this.camX = destX;
        this.camY = destY;
        scale(this.scale);
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

        this.camX = this.camX/cells.length - (halfWidth / this.scale);
        this.camY = this.camY/cells.length - (halfHeight / this.scale);
        scale(this.scale);
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
    getAbsoluteMouse()
    {
        return {
            x: this.camX + (mouseX / this.scale),
            y: this.camY + (mouseY / this.scale)
        };
    }
}
function readProp(val, def)
{
    if(typeof val === "undefined")
    {
        return def;
    }
    return val;
}
class Client
{
    constructor(camera)
    {
        this.localIds = [];
        this.entityList = {};
        this.foodTree = new Quadtree(0, 0, 2048, 2048);
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
        let doShoot = wPressed && !lastWPressed;
        let mousePos = cam.getAbsoluteMouse();
        this.webSock.send(JSON.stringify({
            type: "input",
            x: mousePos.x,
            y: mousePos.y,
            split: doSplit,
            shoot: doShoot
        }));
    }
    receiveMyCells(ids)
    {
        this.localIds = ids;
    }
    createEntity(entityData) 
    {
        let id = readProp(entityData["id"], -1);
        if(entityData.entityType == "cell")
        {
            let x = readProp(entityData["x"], -1);
            let y = readProp(entityData["y"], -1);
            let mass = readProp(entityData["mass"], -1);
            let radius = readProp(entityData["radius"], -1);
            let color = readProp(entityData["color"], [255, 0, 0]);
            let cell = new Cell(x, y, radius, mass, id);
            cell.color = color;
            this.entityList[id] = cell;
        }
        else if(entityData.entityType=="food")
        {
            let x = readProp(entityData["x"], -1);
            let y = readProp(entityData["y"], -1);
            this.entityList[id] = {x: x, y: y, id: id, type: "food"};
        }
        else if(entityData.entityType == "mass")
        {
            let x = readProp(entityData["x"], -1);
            let y = readProp(entityData["y"], -1);
            let mass = readProp(entityData["mass"], -1);
            let radius = readProp(entityData["radius"], -1);
            let massEntity = new Mass(x, y, radius, mass, id);
            this.entityList[id] = massEntity;
        }
    }
    updateEntity(e)
    {
        if(this.entityList.hasOwnProperty(e.id))
        {
            let entity = this.entityList[e.id];
            let properties = [];
            for(let key in e)
            {
                entity[key] = e[key];
                properties.push(key);
            }
            if(typeof entity.updatedProperties === "function")
            {
                entity.updatedProperties(properties);
            }
        }
    }
    removeEntity(id)
    {
        delete this.entityList[id];
        for(let i = client.localIds.length - 1; i >= 0; i--)
        {
            if(id == client.localIds[i])
            {
                client.localIds.splice(i, 1);
            }
        }
    }
    updateEntities()
    {
        this.sendInput();
        for(let key in this.entityList)
        {
            let entity = this.entityList[key];
            if(entity.type == "cell")
            {
                entity.draw();
            }
            else if(entity.type == "mass")
            {
                entity.draw();
            }
            else if(entity.type == "food")
            {
                //ellipse(entity.x, entity.y, foodRadius * 2, foodRadius * 2);
                if(foodGraphic != null)
                {
                    image(foodGraphic, entity.x - foodRadius, entity.y - foodRadius);
                }
                else
                {
                    let rad2 = foodRadius * 2;
                    foodGraphic = createGraphics(rad2, rad2);
                    foodGraphic.background(0, 0);
                    foodGraphic.ellipse(foodRadius, foodRadius, rad2, rad2);
                }
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
var wPressed, lastWPressed;
var foodRadius = 4, foodGraphic = null;
var worldSize = [2,2];
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
    else if (data.type == "worldSize")
    {
        worldSize = data.size;
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
var sqrt3 = Math.sqrt(3);
var len = 30;
var len3 = len * 3;
var len15 = len * 1.5;
var lend2 = len / 2;
var wid = lend2 * sqrt3;
var wid2 = wid * 2;
var wid4 = wid * 4;
function zaggyLine(x, y, wid)
{
    let currX = x;
    let currY = y;
    let up = false;
    let wlw = x + width + len + wid;
    while(currX < wlw)
    {
        let nextX = currX + (lend2 * sqrt3);
        let nextY = (up) ? currY + lend2 : currY - lend2 ;
        line(currX,currY,nextX,nextY);
        currX = nextX;
        currY = nextY;
        if(up)
        {
            line(currX,currY,currX,currY+len);
        }
        up = !up;
    }
}
function hexTile(camera)
{
    let x = camera.camX - camera.camX % (wid2) - wid4;
    let y = camera.camY - camera.camY % (len3) - len15;
    let offset = false;
    stroke(50,50,50);
    strokeWeight(2);
    for(let i = y; i < y + height + 2*len3; i += len15)
    {
        zaggyLine(x + (offset ? wid : 0), i, wid4);
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
    createCanvas(windowWidth, windowHeight);
    halfWidth = width / 2;
    halfHeight = height / 2;
}
function windowResized()
{
    resizeCanvas(windowWidth, windowHeight);
    halfWidth = width / 2;
    halfHeight = height / 2;
}
function draw()
{
    background(0);
    if(connected)
    {
        cam.smoothTrack(client);
        hexTile(cam);
        noFill();
        stroke(255);
        rect(0,0,worldSize[0],worldSize[1]);
        client.updateEntities();
    }

    lastSpacePressed = spacePressed;
    lastWPressed = wPressed;
}
function keyPressed()
{
    if(key == ' ')
    {
        spacePressed = true;
    }
    if(key == 'w')
    {
        wPressed = true;
    }
}
function keyReleased()
{
    if(key == ' ')
    {
        spacePressed = false;
    }
    if(key == 'w')
    {
        wPressed = false;
    }
}