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
    Role["Bass"] = "bass";
    Role["Tenor"] = "tenor";
    Role["Alto"] = "alto";
    Role["Soprano"] = "soprano";
})(Role || (Role = {}));
var Clan;
(function (Clan) {
    Clan["Blue"] = "Blades";
    Clan["Red"] = "Rogues";
    Clan["Yellow"] = "Djinns";
})(Clan || (Clan = {}));
var controls = [];
function play() {
    var width = 900;
    var height = 900;
    /** Parses controls and actions and resolves to a new state. */
    var handleTick = function (controls, state) {
        return state;
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
            shield: 2
        });
    };
    var getDroneColor = function (clan) {
        var _a;
        return (_a = {}, _a[Clan.Red] = 'red', _a[Clan.Blue] = 'blue', _a[Clan.Yellow] = 'yellow', _a)[clan];
    };
    var drawNPCS = function (state) {
        var color = getDroneColor(state.room.clan);
        return function (ctx) {
            state.drones.forEach(function (unit, i) {
                var x = unit.x, y = unit.y;
                ctx.fillStyle = color;
                ctx.fillRect(i * 19, i * 31, 50 + (i * 2), 50 + (i * 2));
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
    var drawRoom = function (state) {
        return function (ctx) {
            drawTiles(ctx);
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
        return handleDraw;
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
    var tick = function (time) {
        var nextState = handleTick(controls, state);
        updateStage(nextState, draw);
        requestAnimationFrame(tick);
    };
    tick(0);
}
play();
