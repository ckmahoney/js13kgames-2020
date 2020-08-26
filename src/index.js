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
        return __assign(__assign({ health: 100, x: 10, y: 30 }, (createShield())), { strength: 100, speed: 100, luck: 100 });
    };
    var createDrone = function () {
        return __assign({ health: 30, role: Role.Bass, clan: Clan.Yellow, x: 30, y: 23 }, (createShield()));
    };
    var drawDrone = function (ctx, unit) {
        var x = unit.x, y = unit.y;
        ctx.fillStyle = "rgb(33,99,111)";
        ctx.drawRect(x, y, 50, 50);
    };
    /** Grabs the rendering context to provide render callback. */
    var setupCanvas = function () {
        var canvas = window.document.querySelector("canvas");
        var ctx = canvas.getContext('2d');
        return function draw(d) {
            ctx.beginPath();
            d(ctx);
            ctx.closePath();
        };
    };
    var getDrones = function (qty) {
        if (qty === void 0) { qty = 4; }
        var drones = [];
        for (var i = 0; i < qty; i++)
            drones.push(createDrone());
        return drones;
    };
    var updateStage = function (state) {
        // ctx.clearRect(0,0,window.innerWidth, window.innerHeight)
        // draw(state)
    };
    var state = { player: createPlayer(),
        drones: getDrones()
    };
    var tick = function (time) {
        var nextState = handleTick(controls, state);
        updateStage(nextState);
        requestAnimationFrame(tick);
    };
}
