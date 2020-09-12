/**
 * uglified quadtree for golfing 
 * @param b Bounds
 * @param l limit
 * @param d depth
 * @param lv level
 * @param os objects <T>[]
 * @param ns nodes Quadtree[]
 */
export let Quadtree = (b, l = 4, d = 10, lv = 0, os = [], ns = [])  => {
    let insert = o => {
        var i = 0,
            indexes;
         
        //if we have subns, call insert on matching subns
        if(ns.length) {
            indexes = getIndex(o);
     
            for(i=0; i<indexes.length; i++) {
                ns[indexes[i]].insert(o);     
            }
            return o;
        }
     
        //otherwise, store object here
        os.push(o);

        //l reached
        if(os.length > l && lv < d) {

            //split if we don't already have subns
            if(!ns.length) {
                //@ts-ignore
                split();
            }
            
            //add all os to their corresponding subnode
            for(i=0; i<os.length; i++) {
                indexes = getIndex(os[i]);
                for(var k=0; k<indexes.length; k++) {
                    ns[indexes[k]].insert(os[i]);
                }
            }

            //clean up this node
            os = [];
        }
        return o;
    }
    let retrieve = o => { 
        var indexes = getIndex(o),
        r = os;
            
        //if we have subnofdes, retrieve their os
        if(ns.length) {
            for(var i=0; i<indexes.length; i++) {
                r = r.concat(ns[indexes[i]].retrieve(o));
            }
        }

        //remove duplicates
        r = r.filter(function(item, index) {
            return r.indexOf(item) >= index;
        });
     
        return r;
    }
    let getIndex = o => {
        var indexes = [],
            verticalMidpoint    = b.x + (b.width/2),
            horizontalMidpoint  = b.y + (b.height/2);    

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
        var next   = lv + 1,
        width    = b.width/2,
            height   = b.height/2,
            x           = b.x,
            y           = b.y;        
        
        const make = (x, y) => (Quadtree({x,y,width,height}))

        //top right node
        ns[0] = make(x+width,y,)
        
        //top left node
        ns[1] = make(x,y)
        
        //bottom left node
        ns[2] = make(x,y+height)
        
        //bottom right node
        ns[3] = make(x+width,y+width)
    }
    let clear = _ => {
        os = [];
 
        for(let i=0; i < ns.length; i++) {
            if(ns.length) {
                ns[i].clear();
              }
        }

        ns = [];
    }
    return {insert, retrieve, getIndex, split, clear}
}