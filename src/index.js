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
var controls = [];
// global constants
var width = 900;
var height = 900;
var aN = function (n) { return !isNaN(n); };
var log = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i] = arguments[_i];
    }
    return any.map(function (a) { return console.log(a); });
};
var isNearWall = function (u, threshold) {
    if (threshold === void 0) { threshold = 0.1; }
    return (u.x <= width * threshold) && (u.y <= height * threshold);
};
var walk = function (u, step) {
    if (step === void 0) { step = 1; }
    var p = u.lastwalk ? 'x' : 'y';
    u[p] = (Math.random() < 0.5) ? u[p] + 1 : u[p] - 1;
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
var throttle = function () {
    return setTimeout(function () { debugger; }, 2000);
};
var changePosition = function (prev, changes) {
    return Object.keys(prev).reduce(function (next, key) {
        var _a;
        return (typeof changes[key] == 'undefined')
            ? next
            : __assign(__assign({}, next), (_a = {}, _a[key] = changes[key](prev[key]), _a));
    }, {});
};
var moveLeft = function (player, amt) {
    if (amt === void 0) { amt = 1; }
    return (__assign(__assign({}, player), { x: player.x -= amt }));
};
var moveRight = function (player, amt) {
    if (amt === void 0) { amt = 1; }
    return (__assign(__assign({}, player), { x: player.x += amt }));
};
// type PlayerControlMap =
//   { [controlKey: string]: Modulate<PlayerControl> }
var applyControl = function (player, controlKey) { return ({ ArrowRight: moveRight,
    ArrowLeft: moveLeft
    // , ArrowDown: land
    // , ArrowUp: jump
})[controlKey](player); };
function play() {
    var updatePositions = function (state, controls) {
        // state.drones.map(d => walk(d))
        state.drones.map(walk);
        var player = controls.reduce(applyControl, state.player);
        return __assign(__assign({}, state), { player: player, drones: state.drones.map(walk) });
    };
    var createRoom = function (clan, prev) {
        return ({ clan: clan,
            prev: prev, role: Role.Bass });
    };
    var createShield = function () {
        return {
            bass: 0,
            tenor: 0,
            alto: 0,
            soprano: 0
        };
    };
    var createPlayer = function () {
        return __assign(__assign({ x: 10, y: 30 }, (createShield())), { strength: 100, speed: 100, luck: 100 });
    };
    var createDrone = function () {
        return ({ x: 30,
            y: 23,
            shield: 2,
            lastwalk: false
        });
    };
    var getClanColor = function (clan) {
        var _a;
        return (_a = {}, _a[Clan.Red] = 'red', _a[Clan.Blue] = 'blue', _a[Clan.Yellow] = 'yellow', _a)[clan];
    };
    var drawNPCS = function (state) {
        var color = getClanColor(state.room.clan);
        var uw = 50;
        var uh = 50;
        return function (ctx) {
            state.drones.forEach(function (_a, i) {
                var x = _a.x, y = _a.y;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, x + uw, y + uh);
            });
        };
    };
    var drawTiles = function (ctx) {
        var tw = 80;
        var th = 80;
        var nx = width / tw;
        var ny = height / th;
        ctx.fillStyle = 'grey';
        ctx.stokeStyle = 'cyan';
        for (var i = 0; i < nx; i++)
            for (var j = 0; j < ny; j++) {
                ctx.fillRect(i * tw - i, j * th - j, i * tw + tw, j * tw + tw);
                ctx.strokeRect(i * tw, j * th, i * tw + tw, j * tw + tw);
            }
    };
    var drawDoors = function (ctx, clan) {
        var altClans = Object.keys(Clan).filter(function (c) { return parseInt(c) !== clan; }).map(function (a) { return parseInt(a); }).filter(aN);
        var doorHeight = 40;
        var offsetWall = 0;
        var doorWidth = 20;
        var offsetCeiling = (height - doorHeight) / 3;
        // left door
        ctx.fillStyle = getClanColor(altClans[0]);
        ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight);
        // right door
        ctx.fillStyle = getClanColor(altClans[1]);
        ctx.fillRect(width - offsetWall - doorWidth, offsetCeiling, width - offsetWall + doorWidth, offsetCeiling + doorHeight);
    };
    var drawRoom = function (state) {
        return function (ctx) {
            drawTiles(ctx);
            drawDoors(ctx, state.room.clan);
            ctx.strokeStyle = "black";
            ctx.strokeRect(0, 0, 600, 600);
        };
    };
    /** Grabs the rendering context to provide render callback. */
    var setupCanvas = function () {
        var canvas = window.document.querySelector("canvas");
        canvas.width = 900;
        canvas.height = 900;
        var ctx = canvas.getContext('2d');
        var handleDraw = function (d) {
            ctx.beginPath();
            d(ctx);
            ctx.closePath();
        };
        var handleKeypress = function (e) {
            var off = on(canvas, 'keydown', handleKeypress);
        };
        return handleDraw;
    };
    var addControlKey = function (e, list) {
        return (e.repeat === true)
            ? list
            : list.concat(e.key);
        return list;
    };
    var getDrones = function (qty, drones) {
        if (qty === void 0) { qty = 4; }
        if (drones === void 0) { drones = []; }
        if (qty === 0)
            return drones;
        drones = drones.concat(createDrone());
        return getDrones(qty - 1, drones);
    };
    var updateStage = function (state, ill) {
        ill(function (ctx) { return ctx.clearRect(0, 0, 900, 900); });
        ill(drawRoom(state));
        ill(drawNPCS(state));
    };
    var draw = setupCanvas();
    var state = { player: createPlayer(),
        drones: getDrones(),
        room: { clan: Clan.Yellow, prev: null, role: Role.Bass }
    };
    /** Parses controls and actions and resolves to a new state. */
    var handleTick = function (controls, state) {
        state = updatePositions(state, controls);
        return state;
    };
    var tick = function (time) {
        var nextState = handleTick(controls, state);
        updateStage(nextState, draw);
        requestAnimationFrame(tick);
    };
    tick(0);
}
play();
