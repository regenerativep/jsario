//this is a quadtree
class Quadtree
{
    constructor(x, y, width, height, parent)
    {
        this.parent = parent;
        if(parent == null)
        {
            this.depth = 0;
        }
        else
        {
            this.depth = parent.depth + 1;
        }
        this.children = null;
        this.item = null;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.widd2 = x + width / 2;
        this.hgtd2 = y + height / 2;
        this.maxDepth = 32;
        this.triggered = false;
    }
    addItem(item)
    {
        if(this.item != null)
        {
            if(this.item.x == item.x && this.item.y == item.y)
            {
                return;
            }
            this.split();
        }
        if(this.children != null)
        {
            let child = 0;
            child |= item.x > this.widd2 ? 1 : 0;
            child |= item.y > this.hgtd2 ? 2 : 0;
            this.children[child].addItem(item);
        }
        else if(this.item == null)
        {
            this.item = item;
        }
    }
    getItemsIn(cond)
    {
        this.triggered = false;
        if(cond(this.x, this.y, this.width, this.height))
        {
            if(this.children == null)
            {
                this.triggered = true;
                if(this.item == null)
                {
                    return [];
                }
                else
                {
                    return [this.item];
                }
            }
            else
            {
                let items = [];
                for(let i = 0; i < this.children.length; i++)
                {
                    items.push(...this.children[i].getItemsIn(cond));
                }
                return items;
            }
            
        }
        return [];
    }
    attemptCollapse()
    {
        let heldItems = 0;
        let item = null;
        if(this.children != null)
        {
            for(let i = 0; i < this.children.length; i++)
            {
                if(this.children[i].item != null)
                {
                    heldItems += 1;
                    item = this.children[i].item;
                }
                if(this.children[i].children != null)
                {
                    heldItems += 2;
                }
            }
        }
        if(heldItems<2)
        {
            this.children = null;
            if(heldItems == 1)
            {
                this.item = item;
            }
        }
    }
    removeItem(item)
    {
        if(this.item == null)
        {
            if(this.children != null)
            {
                let child = 0;
                if(item.x > this.widd2)
                {
                    if(item.y > this.hgtd2)
                    {
                        child = 3;
                    }
                    else
                    {
                        child = 1;
                    }
                }
                else if(item.y > this.hgtd2)
                {
                    child = 2;
                }
                this.children[child].removeItem(item);
            }
        }
        else
        {
            this.item = null;
            this.parent.attemptCollapse(); //if code breaks could be a bad implementation here by me, Nate
        }
    }
    moveItem(item,prevX,prevY)
    {
        if(this.item == null)
        {
            if(this.children != null)
            {
                let child = 0;
                if(prevX > this.widd2)
                {
                    if(prevY > this.hgtd2)
                    {
                        child = 3;
                    }
                    else
                    {
                        child = 1;
                    }
                }
                else if(prevY > this.hgtd2)
                {
                    child = 2;
                }
                this.children[child].moveItem(item,prevX,prevY);
            }
        }
        else
        {
            this.item = null;
            this.parent.attemptCollapse(); //if code breaks could be a bad implementation here by me, Nate
        }
        if(this.depth==0)
        {
            this.addItem(item);
        }
    }
    split()
    {
        if(this.depth >= this.maxDepth)
        {
            //return;
        }
        this.children = [];
        let wd2 = this.width / 2;
        let hd2 = this.height / 2;
        this.children[0] = new Quadtree(this.x, this.y, wd2, hd2, this);
        this.children[1] = new Quadtree(this.x + wd2, this.y, wd2, hd2, this);
        this.children[2] = new Quadtree(this.x, this.y + hd2, wd2, hd2, this);
        this.children[3] = new Quadtree(this.x + wd2, this.y + hd2, wd2, hd2, this);
        let item = this.item;
        this.item = null;
        this.addItem(item);
    }
}
try
{
    module.exports = Quadtree;
}
catch(e)
{
    //
}