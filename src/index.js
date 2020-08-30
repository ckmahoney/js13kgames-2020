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
var canvasWidth = 800;
var canvasHeight = 450;
var playerHeight = 80;
var playerWidth = 80;
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
    return (u.x <= canvasWidth * threshold) && (u.y <= canvasHeight * threshold);
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
    if (amt === void 0) { amt = 3; }
    return (__assign(__assign({}, u), { x: u.x > 0 ? u.x -= amt : 0 }));
};
var moveRight = function (u, amt) {
    if (amt === void 0) { amt = 3; }
    return (__assign(__assign({}, u), { x: u.x < (canvasWidth - playerWidth) ? u.x += amt : (canvasWidth - playerWidth) }));
};
var moveUp = function (u, amt) {
    if (amt === void 0) { amt = 3; }
    return (__assign(__assign({}, u), { y: u.y >= (0) ? u.y -= amt : playerHeight }));
};
var moveDown = function (u, amt) {
    if (amt === void 0) { amt = 3; }
    return (__assign(__assign({}, u), { y: u.y <= (canvasHeight) ? u.y += amt : (canvasHeight) }));
};
var controlMap = function () {
    return ({ ArrowRight: moveRight,
        ArrowLeft: moveLeft,
        ArrowDown: moveDown,
        ArrowUp: moveUp
    });
};
var applyControl = function (player, controlKey) {
    var map = controlMap();
    // @ts-ignore property includes does not exist on type string[]
    if (!(Object.keys(map).includes(controlKey)))
        return player;
    return map[controlKey](player);
};
var game = function () {
    var updatePositions = function (state) {
        return (__assign(__assign({}, state), { player: game.controls.reduce(applyControl, state.player), drones: state.drones.map(walk) }));
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
        return ({ shield: { bass: 0,
                tenor: 0,
                alto: 0,
                soprano: 0
            },
            x: 50,
            y: canvasHeight - 230 - 10,
            strength: 100,
            speed: 100,
            luck: 100
        });
    };
    var createDrone = function () {
        return ({ x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            shield: 2,
            lastwalk: false
        });
    };
    var getClanColor = function (clan) {
        var _a;
        return (_a = {}, _a[Clan.Red] = 'red', _a[Clan.Blue] = 'blue', _a[Clan.Yellow] = 'yellow', _a)[clan];
    };
    var getClanText = function (clan) {
        var _a;
        return (_a = {}, _a[Clan.Red] = '+++', _a[Clan.Blue] = '###', _a[Clan.Yellow] = '///', _a)[clan];
    };
    var getClanAttributes = function (clan) { return ({ color: getClanColor(clan),
        text: getClanText(clan)
    }); };
    var drawNPCS = function (state) {
        var _a = getClanAttributes(state.room.clan), color = _a.color, text = _a.text;
        var uw = 50;
        var uh = 50;
        return function (ctx) {
            state.drones.forEach(function (_a, i) {
                var x = _a.x, y = _a.y;
                ctx.fillStyle = color;
                ctx.fillText(text, x, y);
            });
        };
    };
    var drawPlayer = function (state) {
        var color = drawPlayer.color || (drawPlayer.color = 'magenta');
        var text = drawPlayer.text || (drawPlayer.text = '!*!');
        return function (ctx) {
            ctx.fillStyle = color;
            ctx.fillText(text, state.player.x, state.player.y);
        };
    };
    var drawTiles = function (ctx) {
        var tw = 80;
        var th = 80;
        var nx = canvasWidth / tw;
        var ny = canvasHeight / th;
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
        var offsetCeiling = (canvasHeight - doorHeight) / 3;
        // left door
        ctx.fillStyle = getClanColor(altClans[0]);
        ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight);
        // right door
        ctx.fillStyle = getClanColor(altClans[1]);
        ctx.fillRect(canvasWidth - offsetWall - doorWidth, offsetCeiling, canvasWidth - offsetWall + doorWidth, offsetCeiling + doorHeight);
    };
    var drawRoom = function (state) {
        return function (ctx) {
            drawTiles(ctx);
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
    var updateStage = function (state, ill) {
        ill(function (ctx) { return ctx.clearRect(0, 0, 900, 900); });
        ill(drawRoom(state));
        ill(drawNPCS(state));
        ill(drawPlayer(state));
    };
    var updateListeners = function (state) {
        if (typeof updateListeners.listen == 'function')
            window.removeEventListener('keydown', updateListeners.listen);
        updateListeners.listen = function (e) { return handleKeydown(e); };
        window.addEventListener('keydown', updateListeners.listen);
        return updateListeners.prev || [];
    };
    var tick = function (time, state, draw) {
        var nState = updatePositions(state);
        updateListeners(state);
        updateStage(nState, draw);
        requestAnimationFrame(function (ntime) { return tick(ntime, nState, draw); });
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
    var controls = [];
    var state = { player: createPlayer(),
        drones: getDrones(),
        room: { clan: Clan.Yellow, prev: null, role: Role.Bass }
    };
    go(state, tick);
};
game.controls = [];
game();
