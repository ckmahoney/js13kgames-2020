export function Quadtree(bounds, limits = 4, depth = 10, level = 0) {
    
    this.limits    = limits;
    this.depth     = depth;
    
    this.level  = level;
    this.bounds = bounds;
    
    this.objects    = [];
    this.nodes      = [];
};


/**
 * Split the node into 4 subnodes
 */
Quadtree.split = function() {
    
    var next   = this.level + 1,
        width    = this.bounds.width/2,
        height   = this.bounds.height/2,
        x           = this.bounds.x,
        y           = this.bounds.y;        
    
    const make = (x, y) => (new Quadtree({x,y,width,height}))

    //top right node
    this.nodes[0] = make(x+width,y,)
    
    //top left node
    this.nodes[1] = make(x,y)
    
    //bottom left node
    this.nodes[2] = make(x,y+height)
    
    //bottom right node
    this.nodes[3] = make(x+width,y+width)
};


/**
 * Determine which node the object belongs to
 * @param Object pRect      bounds of the area to be checked, with x, y, width, height
 * @return Array            an array of indexes of the intersecting subnodes 
 *                          (0-3 = top-right, top-left, bottom-left, bottom-right / ne, nw, sw, se)
 */
Quadtree.getIndex = function(pRect) {
    
    var indexes = [],
        verticalMidpoint    = this.bounds.x + (this.bounds.width/2),
        horizontalMidpoint  = this.bounds.y + (this.bounds.height/2);    

    var startIsNorth = pRect.y < horizontalMidpoint,
        startIsWest  = pRect.x < verticalMidpoint,
        endIsEast    = pRect.x + pRect.width > verticalMidpoint,
        endIsSouth   = pRect.y + pRect.height > horizontalMidpoint;    

    //top-right quad
    if(startIsNorth && endIsEast) {
        indexes.push(0);
    }
    
    //top-left quad
    if(startIsWest && startIsNorth) {
        indexes.push(1);
    }

    //bottom-left quad
    if(startIsWest && endIsSouth) {
        indexes.push(2);
    }

    //bottom-right quad
    if(endIsEast && endIsSouth) {
        indexes.push(3);
    }
 
    return indexes;
};


/**
 * Insert the object into the node. If the node
 * exceeds the capacity, it will split and add all
 * objects to their corresponding subnodes.
 * @param Object pRect        bounds of the object to be added { x, y, width, height }
 */
Quadtree.insert = function(pRect) {
    
    var i = 0,
        indexes;
     
    //if we have subnodes, call insert on matching subnodes
    if(this.nodes.length) {
        indexes = this.getIndex(pRect);
 
        for(i=0; i<indexes.length; i++) {
            this.nodes[indexes[i]].insert(pRect);     
        }
        return pRect;
    }
 
    //otherwise, store object here
    this.objects.push(pRect);

    //limits reached
    if(this.objects.length > this.limits && this.level < this.depth) {

        //split if we don't already have subnodes
        if(!this.nodes.length) {
            this.split();
        }
        
        //add all objects to their corresponding subnode
        for(i=0; i<this.objects.length; i++) {
            indexes = this.getIndex(this.objects[i]);
            for(var k=0; k<indexes.length; k++) {
                this.nodes[indexes[k]].insert(this.objects[i]);
            }
        }

        //clean up this node
        this.objects = [];
    }
    return pRect;
 };
 
 
/**
 * Return all objects that could collide with the given object
 * @param Object pRect      bounds of the object to be checked { x, y, width, height }
 * @Return Array            array with all detected objects
 */
Quadtree.retrieve = function(pRect) {
     
    var indexes = this.getIndex(pRect),
        returnObjects = this.objects;
        
    //if we have subnofdes, retrieve their objects
    if(this.nodes.length) {
        for(var i=0; i<indexes.length; i++) {
            returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(pRect));
        }
    }

    //remove duplicates
    returnObjects = returnObjects.filter(function(item, index) {
        return returnObjects.indexOf(item) >= index;
    });
 
    return returnObjects;
};


/**
 * Clear the quadtree
 */
Quadtree.clear = function() {
    
    this.objects = [];
 
    for(let i=0; i < this.nodes.length; i++) {
        if(this.nodes.length) {
            this.nodes[i].clear();
          }
    }

    this.nodes = [];
};