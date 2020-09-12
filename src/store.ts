export function Quadtree(bounds, limits = 4, depth = 10, level = 0, objects = [], nodes = []) {
    let insert = o => {
        var i = 0,
            indexes;
         
        //if we have subnodes, call insert on matching subnodes
        if(nodes.length) {
            indexes = getIndex(o);
     
            for(i=0; i<indexes.length; i++) {
                nodes[indexes[i]].insert(o);     
            }
            return o;
        }
     
        //otherwise, store object here
        objects.push(o);

        //limits reached
        if(objects.length > limits && level < depth) {

            //split if we don't already have subnodes
            if(!nodes.length) {
                //@ts-ignore
                split();
            }
            
            //add all objects to their corresponding subnode
            for(i=0; i<objects.length; i++) {
                indexes = getIndex(objects[i]);
                for(var k=0; k<indexes.length; k++) {
                    nodes[indexes[k]].insert(objects[i]);
                }
            }

            //clean up this node
            objects = [];
        }
        return o;
    }
    let retrieve = o => { 
        var indexes = getIndex(o),
        returnObjects = objects;
            
        //if we have subnofdes, retrieve their objects
        if(nodes.length) {
            for(var i=0; i<indexes.length; i++) {
                returnObjects = returnObjects.concat(nodes[indexes[i]].retrieve(o));
            }
        }

        //remove duplicates
        returnObjects = returnObjects.filter(function(item, index) {
            return returnObjects.indexOf(item) >= index;
        });
     
        return returnObjects;
    }
    let getIndex = o => {
        var indexes = [],
            verticalMidpoint    = bounds.x + (bounds.width/2),
            horizontalMidpoint  = bounds.y + (bounds.height/2);    

        var startIsNorth = o.y < horizontalMidpoint,
            startIsWest  = o.x < verticalMidpoint,
            endIsEast    = o.x + o.width > verticalMidpoint,
            endIsSouth   = o.y + o.height > horizontalMidpoint;    

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
    }
    let split = _ => {
        var next   = level + 1,
        width    = bounds.width/2,
            height   = bounds.height/2,
            x           = bounds.x,
            y           = bounds.y;        
        
        const make = (x, y) => (Quadtree({x,y,width,height}))

        //top right node
        nodes[0] = make(x+width,y,)
        
        //top left node
        nodes[1] = make(x,y)
        
        //bottom left node
        nodes[2] = make(x,y+height)
        
        //bottom right node
        nodes[3] = make(x+width,y+width)
    }
    let clear = _ => {
        objects = [];
 
        for(let i=0; i < nodes.length; i++) {
            if(nodes.length) {
                nodes[i].clear();
              }
        }

        nodes = [];
    }
    return {insert, retrieve, getIndex, split, clear}
}
