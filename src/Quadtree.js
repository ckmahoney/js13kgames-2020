"use strict";
exports.__esModule = true;
exports.Quadtree = void 0;
/**
 * Quadtree Constructor
 * @param Object bounds            bounds of the node { x, y, width, height }
 * @param Integer max_objects      (optional) max objects a node can hold before splitting into 4 subnodes (default: 10)
 * @param Integer max_levels       (optional) total max levels inside root Quadtree (default: 4)
 * @param Integer level            (optional) deepth level, required for subnodes (default: 0)
 */
var Quadtree = /** @class */ (function () {
    function Quadtree(bounds, max_objects, max_levels, level) {
        if (max_objects === void 0) { max_objects = 10; }
        if (max_levels === void 0) { max_levels = 4; }
        if (level === void 0) { level = 0; }
        this.objects = [];
        this.nodes = [];
        this.max_objects = 0;
        this.max_levels = 0;
        this.level = 0;
        this.bounds = { x: 0, y: 0, width: 0, height: 0 };
        this.max_objects = max_objects || 10;
        this.max_levels = max_levels || 4;
        this.level = level || 0;
        this.bounds = bounds;
        this.objects = [];
        this.nodes = [];
    }
    Quadtree.prototype.split = function () {
        var nextLevel = this.level + 1, subWidth = this.bounds.width / 2, subHeight = this.bounds.height / 2, x = this.bounds.x, y = this.bounds.y;
        //top right node
        this.nodes[0] = new Quadtree({
            x: x + subWidth,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        //top left node
        this.nodes[1] = new Quadtree({
            x: x,
            y: y,
            width: subWidth,
            height: subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        //bottom left node
        this.nodes[2] = new Quadtree({
            x: x,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        //bottom right node
        this.nodes[3] = new Quadtree({
            x: x + subWidth,
            y: y + subHeight,
            width: subWidth,
            height: subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        return;
    };
    Quadtree.prototype.getIndex = function (pRect) {
        var indexes = [], verticalMidpoint = this.bounds.x + (this.bounds.width / 2), horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);
        var startIsNorth = pRect.y < horizontalMidpoint, startIsWest = pRect.x < verticalMidpoint, endIsEast = pRect.x + pRect.width > verticalMidpoint, endIsSouth = pRect.y + pRect.height > horizontalMidpoint;
        //top-right quad
        if (startIsNorth && endIsEast) {
            indexes.push(0);
        }
        //top-left quad
        if (startIsWest && startIsNorth) {
            indexes.push(1);
        }
        //bottom-left quad
        if (startIsWest && endIsSouth) {
            indexes.push(2);
        }
        //bottom-right quad
        if (endIsEast && endIsSouth) {
            indexes.push(3);
        }
        return indexes;
    };
    Quadtree.prototype.insert = function (pRect) {
        var i = 0, indexes;
        //if we have subnodes, call insert on matching subnodes
        if (this.nodes.length) {
            indexes = this.getIndex(pRect);
            for (i = 0; i < indexes.length; i++) {
                this.nodes[indexes[i]].insert(pRect);
            }
            return;
        }
        //otherwise, store object here
        this.objects.push(pRect);
        //max_objects reached
        if (this.objects.length > this.max_objects && this.level < this.max_levels) {
            //split if we don't already have subnodes
            if (!this.nodes.length) {
                this.split();
            }
            //add all objects to their corresponding subnode
            for (i = 0; i < this.objects.length; i++) {
                indexes = this.getIndex(this.objects[i]);
                for (var k = 0; k < indexes.length; k++) {
                    this.nodes[indexes[k]].insert(this.objects[i]);
                }
            }
            //clean up this node
            this.objects = [];
        }
        return;
    };
    Quadtree.prototype.retrieve = function (pRect) {
        var indexes = this.getIndex(pRect);
        var returnObjects = this.objects;
        //if we have subnodes, retrieve their objects
        if (this.nodes.length) {
            for (var i = 0; i < indexes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(pRect));
            }
        }
        //remove duplicates
        returnObjects = returnObjects.filter(function (item, index) {
            return returnObjects.indexOf(item) >= index;
        });
        return returnObjects;
    };
    Quadtree.prototype.clear = function () {
        this.objects = [];
        for (var i = 0; i < this.nodes.length; i++)
            if (this.nodes.length)
                this.nodes[i].clear();
        this.nodes = [];
        return;
    };
    return Quadtree;
}());
module.exports.Quadtree = Quadtree;
// module.exports = { Quadtree };
