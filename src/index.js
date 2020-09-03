var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
console.clear();
var Role;
(function (Role) {
    Role[Role["Bass"] = 0] = "Bass";
    Role[Role["Tenor"] = 1] = "Tenor";
    Role[Role["Alto"] = 2] = "Alto";
    Role[Role["Soprano"] = 3] = "Soprano";
})(Role || (Role = {}));
var Clan;
(function (Clan) {
    Clan[Clan["Blue"] = 0] = "Blue";
    Clan[Clan["Red"] = 1] = "Red";
    Clan[Clan["Yellow"] = 2] = "Yellow";
})(Clan || (Clan = {}));
var getLocations = function (unit, bounds) {
    var verticalMidpoint = bounds.x + (bounds.width / 2), horizontalMidpoint = bounds.y + (bounds.height / 2);
    var startIsNorth = unit.y < horizontalMidpoint, startIsWest = unit.x < verticalMidpoint, endIsEast = unit.x + unit.width > verticalMidpoint, endIsSouth = unit.y + unit.height > horizontalMidpoint;
    return ([startIsNorth && endIsEast,
        startIsWest && startIsNorth,
        startIsWest && endIsSouth,
        endIsEast && endIsSouth])
        .map(function (inLocation, i) { return inLocation ? i : NaN; }).filter(aN);
};
function Quadtree(bounds, max_objects, max_levels, level) {
    if (max_objects === void 0) { max_objects = 4; }
    if (max_levels === void 0) { max_levels = 10; }
    if (level === void 0) { level = 0; }
    this.max_objects = max_objects || 10;
    this.max_levels = max_levels || 4;
    this.level = level || 0;
    this.bounds = bounds;
    this.objects = [];
    this.nodes = [];
}
;
/**
 * Split the node into 4 subnodes
 */
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
};
/**
 * Determine which node the object belongs to
 * @param Object pRect      bounds of the area to be checked, with x, y, width, height
 * @return Array            an array of indexes of the intersecting subnodes
 *                          (0-3 = top-right, top-left, bottom-left, bottom-right / ne, nw, sw, se)
 */
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
/**
 * Insert the object into the node. If the node
 * exceeds the capacity, it will split and add all
 * objects to their corresponding subnodes.
 * @param Object pRect        bounds of the object to be added { x, y, width, height }
 */
Quadtree.prototype.insert = function (pRect) {
    var i = 0, indexes;
    //if we have subnodes, call insert on matching subnodes
    if (this.nodes.length) {
        indexes = this.getIndex(pRect);
        for (i = 0; i < indexes.length; i++) {
            this.nodes[indexes[i]].insert(pRect);
        }
        return pRect;
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
    return pRect;
};
/**
 * Return all objects that could collide with the given object
 * @param Object pRect      bounds of the object to be checked { x, y, width, height }
 * @Return Array            array with all detected objects
 */
Quadtree.prototype.retrieve = function (pRect) {
    var indexes = this.getIndex(pRect), returnObjects = this.objects;
    //if we have subnofdes, retrieve their objects
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
/**
 * Clear the quadtree
 */
Quadtree.prototype.clear = function () {
    this.objects = [];
    for (var i = 0; i < this.nodes.length; i++) {
        if (this.nodes.length) {
            this.nodes[i].clear();
        }
    }
    this.nodes = [];
};
//export for commonJS or browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Quadtree;
}
else {
    window.Quadtree = Quadtree;
}
// global constants
var canvasWidth = 800;
var canvasHeight = 450;
var playerHeight = 80;
var playerWidth = 80;
var tree = new Quadtree({ x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);
var aN = function (n) { return !isNaN(n); };
var log = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i] = arguments[_i];
    }
    return any.map(function (a) { return console.log(a); });
};
var coinToss = function () {
    return (Math.random() < 0.5);
};
var isNearWall = function (u, threshold) {
    if (threshold === void 0) { threshold = 0.1; }
    return (u.x <= canvasWidth * threshold) && (u.y <= canvasHeight * threshold);
};
var walk = function (u, step) {
    if (step === void 0) { step = 1; }
    var p = u.lastwalk ? 'x' : 'y';
    u[p] = coinToss() ? u[p] + 1 : u[p] - 1;
    u.lastwalk = !u.lastwalk;
    return u;
};
var off = function (el, name, fn) {
    return el.removeEventListener(name, fn);
};
var on = function (el, name, fn) {
    el.addEventListener(name, fn);
    return function cleanup() { off(el, name, fn); };
};
var throttle = function (seconds) {
    if (seconds === void 0) { seconds = 2; }
    return setTimeout(function () { debugger; }, seconds * 1000);
};
var changePosition = function (prev, changes) {
    return Object.keys(prev).reduce(function (next, key) {
        var _a;
        return (typeof changes[key] == 'undefined')
            ? next
            : __assign(__assign({}, next), (_a = {}, _a[key] = changes[key](prev[key]), _a));
    }, {});
};
var moveLeft = function (u, amt) {
    if (amt === void 0) { amt = 7; }
    return (__assign(__assign({}, u), { x: u.x > 0 ? u.x -= amt : 0 }));
};
var moveRight = function (u, amt) {
    if (amt === void 0) { amt = 7; }
    return (__assign(__assign({}, u), { x: u.x < (canvasWidth - playerWidth) ? u.x += amt : (canvasWidth - playerWidth) }));
};
var moveUp = function (u, amt) {
    if (amt === void 0) { amt = 7; }
    return (__assign(__assign({}, u), { y: u.y >= (0) ? u.y -= amt : playerHeight }));
};
var moveDown = function (u, amt) {
    if (amt === void 0) { amt = 7; }
    return (__assign(__assign({}, u), { y: u.y <= (canvasHeight) ? u.y += amt : (canvasHeight) }));
};
var fire = function (time, state) {
    var player = state.player, fx = state.fx;
    var origin = { x: player.x,
        y: player.y
    };
    return (__assign(__assign({}, state), { fx: fx.concat({ type: 'attack', origin: origin }) }));
};
var motionControls = function () { return ({ ArrowRight: moveRight,
    ArrowLeft: moveLeft,
    ArrowDown: moveDown,
    ArrowUp: moveUp
}); };
var actionControls = function () { return ({ f: fire
}); };
var applyMotion = function (player, controlKey) {
    var map = motionControls();
    // @ts-ignore property includes does not exist on type string[]
    if (!(Object.keys(map).includes(controlKey)))
        return player;
    return map[controlKey](player);
};
var applyActions = function (state, controlKey) {
    var map = actionControls();
    // @ts-ignore property includes does not exist on type string[]
    if (!(Object.keys(map).includes(controlKey)))
        return state;
    return map[controlKey](state);
};
var game = function () {
    var applyControls = function (time, state) {
        return (__assign(__assign({}, state), { player: game.controls.reduce(applyMotion, state.player), fx: state.fx.reduce(applyActions, state.fx), drones: state.drones.map(walk) }));
    };
    var createRoom = function (clan, role) { return ({ clan: clan,
        role: role
    }); };
    var createShield = function () {
        return {
            bass: 0,
            tenor: 0,
            alto: 0,
            soprano: 0
        };
    };
    var createPlayer = function () {
        return ({ name: 'player',
            shield: { 0: { clan: null, strength: 0 },
                1: { clan: null, strength: 0 },
                2: { clan: null, strength: 0 },
                3: { clan: null, strength: 0 }
            },
            width: playerWidth,
            height: playerHeight,
            x: canvasWidth - playerWidth,
            y: 10,
            strength: 100,
            speed: 100,
            luck: 100
        });
    };
    var createDrone = function (defaults) {
        if (defaults === void 0) { defaults = {}; }
        return Object.assign({ name: 'drone',
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            width: 40,
            height: 40,
            shield: 2,
            lastwalk: false
        }, defaults);
    };
    var createShieldDrop = function (defaults) {
        if (defaults === void 0) { defaults = {}; }
        return Object.assign({ name: 'shield',
            clan: '',
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            width: 40,
            height: 40
        }, defaults);
    };
    var getClanColor = function (clan) {
        var _a;
        return (_a = {}, _a[Clan.Red] = 'red', _a[Clan.Blue] = 'blue', _a[Clan.Yellow] = 'yellow', _a)[clan];
    };
    var getClanText = function (clan) {
        var _a;
        return (_a = {}, _a[Clan.Red] = '+', _a[Clan.Blue] = '#', _a[Clan.Yellow] = '/', _a)[clan];
    };
    var getClanAttributes = function (clan) { return ({ color: getClanColor(clan),
        text: getClanText(clan)
    }); };
    var drawNPCS = function (time, state) {
        var _a = getClanAttributes(state.room.clan), color = _a.color, text = _a.text;
        var uw = 50;
        var uh = 50;
        return function (ctx) {
            state.drones.forEach(function (_a, i) {
                var x = _a.x, y = _a.y, shield = _a.shield;
                ctx.fillStyle = color;
                //@ts-ignore
                ctx.fillText(text.repeat(shield), x, y);
            });
        };
    };
    var drawPlayer = function (time, state) {
        var color = drawPlayer.color || (drawPlayer.color = 'white');
        var text = drawPlayer.text || (drawPlayer.text = '!*!');
        return function (ctx) {
            ctx.fillStyle = color;
            ctx.fillText(text, state.player.x, state.player.y);
        };
    };
    var drawTiles = function (time, ctx) {
        var tw = 80;
        var th = 80;
        var nx = canvasWidth / tw;
        var ny = canvasHeight / th;
        ctx.stokeStyle = 'cyan';
        for (var i = 0; i < nx; i++) {
            var r = (i * tiny(time, 2)) % 255;
            for (var j = 0; j < ny; j++) {
                var g = (j * tiny(time, 1)) % 255;
                var b = (i + j * tiny(time, 2)) % 255;
                ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b + ")";
                ctx.fillRect(i * tw - i, j * th - j, i * tw + tw, j * tw + tw);
                ctx.strokeRect(i * tw, j * th, i * tw + tw, j * tw + tw);
            }
        }
    };
    var drawDoors = function (ctx, clan) {
        var altClans = Object.keys(Clan).map(function (a) { return parseInt(a); }).filter(function (c) { return c !== clan; }).filter(aN);
        var doorHeight = 40;
        var offsetWall = 0;
        var doorWidth = 20;
        var offsetCeiling = (canvasHeight - doorHeight) / 3;
        // left door
        ctx.fillStyle = getClanColor(altClans[0]);
        ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight);
        // right door
        ctx.fillStyle = getClanColor(altClans[1]);
        ctx.fillRect(canvasWidth - offsetWall - doorWidth, offsetCeiling, canvasWidth - offsetWall + doorWidth, offsetCeiling + doorHeight);
    };
    var drawRoom = function (time, state) {
        return function (ctx) {
            drawTiles(time, ctx);
            drawDoors(ctx, state.room.clan);
            ctx.strokeStyle = "black";
            ctx.strokeRect(0, 0, 600, 600);
        };
    };
    var addControlKey = function (key) {
        // @ts-ignore TS2339
        return controls.includes(key) ? controls : controls.concat(key);
    };
    var removeControlKey = function (key) {
        return controls.filter(function (k) { return k !== key; });
    };
    var handleKeydown = function (e) {
        if (e.repeat === true)
            return;
        game.controls = game.controls.concat(e.key);
        var remove = function () {
            game.controls = game.controls.filter(function (k) { return k !== e.key; });
        };
        var cleanup = function (ev) {
            if (e.key === ev.key) {
                remove();
                window.removeEventListener('keyup', cleanup);
            }
        };
        window.addEventListener('keyup', cleanup);
    };
    var getDrones = function (qty, drones) {
        if (qty === void 0) { qty = 4; }
        if (drones === void 0) { drones = []; }
        if (qty === 0)
            return drones;
        drones = drones.concat(createDrone());
        return getDrones(qty - 1, drones);
    };
    var drawStage = function (time, state, illustrate) {
        illustrate(function (ctx) { return ctx.clearRect(0, 0, canvasWidth, canvasHeight); });
        openingRoom(time, state, illustrate);
    };
    var stage = function (time, state, illustrate) {
        illustrate(drawRoom(time, state));
        illustrate(drawNPCS(time, state));
        illustrate(drawPlayer(time, state));
    };
    var updateListeners = function (state) {
        if (typeof updateListeners.listen == 'function')
            window.removeEventListener('keydown', updateListeners.listen);
        updateListeners.listen = function (e) { return handleKeydown(e); };
        window.addEventListener('keydown', updateListeners.listen);
        return updateListeners.prev || [];
    };
    var applyToTree = function (tree, u) {
        tree.insert(u);
        return tree;
    };
    function addOpeningShieldsToTree(time, tree) {
        var clans = Object.keys(Clan).map(function (a) { return parseInt(a); }).filter(aN);
        var containerWidth = canvasWidth * 2 / 3;
        var offsetWall = canvasWidth / 3;
        var offsetCeiling = canvasHeight / 3;
        var elWidth = containerWidth / clans.length;
        for (var i = 0; i < clans.length; i++) {
            var x = offsetWall + (i * elWidth);
            var y = offsetCeiling; // * ((Math.cos(time * (i*0.25)/100)))
            var radius = 1 + 40 * abs(sin((1 + i) * tiny(time)));
            tree.insert({ name: "shield-" + Clan[i], x: x, y: y, width: radius / 2, height: radius / 2 });
        }
        return tree;
    }
    var updateTreeIndices = function (time, state, tree) {
        var items = [];
        if (state.level == 0) {
            addOpeningShieldsToTree(time, tree);
        }
        else {
            items = items.concat(state.drones);
        }
        items = items.concat(state.player);
        return items.reduce(applyToTree, tree);
    };
    var checkCollisions = function (state, tree) {
        throttle(5);
        var player = state.player;
        var intersections = tree.retrieve({
            x: player.x,
            y: player.y,
            width: player.width,
            height: player.height
        });
        var collides = function (unit) {
            if (unit.name == 'player')
                return false;
            return !(unit.x > player.x + player.width ||
                unit.x + unit.width < player.x ||
                unit.y > player.y + player.height ||
                unit.y + unit.height < player.y);
        };
        var touches = intersections.filter(collides);
        return touches;
    };
    var applyShield = function (player, clan, role) {
        log("Role.Bass", Role.Bass);
        log("role", role);
        if (player.shield[role].clan != clan) {
            // Swap the previous shield type with the new one
            player.shield[role].clan = clan;
            player.shield[role].strength = 2;
        }
        player.shield[role].strength += 2;
        return player;
    };
    var handleTouches = function (state, touches) {
        if (state.level == 0) {
            // opening room 
            if (touches.length == 1) {
                log("you touched my butt");
                // first room is a bass shield pickup
                var player = applyShield(state.player, touches[0].clan, Role.Bass);
                return __assign(__assign({}, state), { player: player, level: state.level + 1 });
            }
        }
        return state;
    };
    var setupNextLevel = function (state) {
        var room = nextRoom(state.room.clan, state.room.role);
        var drones = getDrones(state.level * 2);
        return __assign(__assign({}, state), { drones: drones, room: room });
    };
    var tick = function (time, prev, draw) {
        tree.clear();
        var currLevel = state.level;
        var next = applyControls(time, prev);
        updateTreeIndices(time, next, tree);
        var touches = checkCollisions(next, tree);
        next = handleTouches(state, touches);
        if (currLevel != state.level) {
            next = setupNextLevel(state);
        }
        updateListeners(state);
        drawStage(time, next, draw);
        requestAnimationFrame(function (ntime) { return tick(ntime, next, draw); });
    };
    /** Grabs the rendering context to provide render callback. */
    var go = function (state, tick) {
        var canvas = window.document.querySelector("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        var ctx = canvas.getContext('2d');
        ctx.font = '50px monospace';
        var draw = function (d) {
            ctx.beginPath();
            d(ctx);
            ctx.closePath();
        };
        tick(0, state, draw);
    };
    var abs = Math.abs, sin = Math.sin, cos = Math.cos, pow = Math.pow;
    var tiny = function (n, scale) {
        if (scale === void 0) { scale = 3; }
        return n * pow(10, -(scale));
    };
    var controls = [];
    var state = { player: createPlayer(),
        drones: [],
        fx: [], room: { clan: null, role: null }, level: 0 };
    var openingRoom = function (time, state, illustrate) {
        var clans = Object.keys(Clan).map(function (a) { return parseInt(a); }).filter(aN);
        var containerWidth = canvasWidth * 2 / 3;
        var offsetWall = canvasWidth / 3;
        var offsetCeiling = canvasHeight / 3;
        var elWidth = containerWidth / clans.length;
        illustrate(function (ctx) { return drawTiles(time, ctx); });
        var _loop_1 = function (i) {
            illustrate(function (ctx) {
                var x = offsetWall + (i * elWidth);
                var y = offsetCeiling; // * ((Math.cos(time * (i*0.25)/100)))
                var radius = 1 + 40 * abs(sin((1 + i) * tiny(time)));
                var unit = createShieldDrop({ x: x, y: y, width: radius, height: radius, clan: Clan[i] });
                unit.width = radius;
                unit.height = radius;
                ctx.fillStyle = ctx.strokeStyle = getClanColor(i);
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });
        };
        for (var i = 0; i < clans.length; i++) {
            _loop_1(i);
        }
        illustrate(drawPlayer(time, state));
    };
    // saved preset for showing two elements orbiting around a central unit
    var orbit = function (time, state, illustrate) {
        var radius = 100;
        var clans = Object.keys(Clan).map(function (a) { return parseInt(a); }).filter(aN);
        var containerWidth = canvasWidth / 2;
        var offsetWall = canvasWidth / 3;
        var offsetCeiling = canvasHeight / 3;
        var elWidth = containerWidth / clans.length;
        var _loop_2 = function (i) {
            illustrate(function (ctx) {
                var y = offsetWall + (elWidth * i) * ((Math.cos(time * (i * 0.25) / 100)));
                var x = canvasHeight * (Math.abs(Math.sin(time * 0.125 / 1000)));
                ctx.fillStyle = ctx.strokeStyle = getClanColor(i);
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });
        };
        for (var i = 0; i < clans.length; i++) {
            _loop_2(i);
        }
    };
    /** Create a room with new values compared to a previous room. */
    var nextRoom = function (pClan, pRole) {
        var altClans = Object.keys(Clan).map(function (a) { return parseInt(a); }).filter(function (c) { return (c !== pClan) && aN(c); });
        var altRoles = Object.keys(Role).map(function (a) { return parseInt(a); }).filter(function (r) { return (r !== pRole) && aN(r); });
        return ({ clan: altClans[Number(coinToss())],
            role: altRoles[Number(coinToss())]
        });
    };
    go(state, tick);
};
// todo decide if it is worth having a global async controls or use something else
game.controls = [];
game();
