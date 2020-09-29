function Quadtree(bounds, max_objects = 4, max_levels = 10, level = 0) {
    this.max_objects = max_objects || 10;
    this.max_levels = max_levels || 4;
    this.level = level || 0;
    this.bounds = bounds;
    this.objects = [];
    this.nodes = [];
}
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
    for (let i = 0; i < this.nodes.length; i++) {
        if (this.nodes.length) {
            this.nodes[i].clear();
        }
    }
    this.nodes = [];
};

var PitchClass;
(function (PitchClass) {
    PitchClass[PitchClass["C"] = 0] = "C";
    PitchClass[PitchClass["Cs"] = 1] = "Cs";
    PitchClass[PitchClass["D"] = 2] = "D";
    PitchClass[PitchClass["Ds"] = 3] = "Ds";
    PitchClass[PitchClass["E"] = 4] = "E";
    PitchClass[PitchClass["F"] = 5] = "F";
    PitchClass[PitchClass["Fs"] = 6] = "Fs";
    PitchClass[PitchClass["G"] = 7] = "G";
    PitchClass[PitchClass["Gs"] = 8] = "Gs";
    PitchClass[PitchClass["A"] = 9] = "A";
    PitchClass[PitchClass["As"] = 10] = "As";
    PitchClass[PitchClass["B"] = 11] = "B";
})(PitchClass || (PitchClass = {}));
var Intervals;
(function (Intervals) {
    Intervals[Intervals["Unison"] = 0] = "Unison";
    Intervals[Intervals["MinorSecond"] = 1] = "MinorSecond";
    Intervals[Intervals["MajorSecond"] = 2] = "MajorSecond";
    Intervals[Intervals["MinorThird"] = 3] = "MinorThird";
    Intervals[Intervals["MajorThird"] = 4] = "MajorThird";
    Intervals[Intervals["PerfectFourth"] = 5] = "PerfectFourth";
    Intervals[Intervals["Tritone"] = 6] = "Tritone";
    Intervals[Intervals["PerfectFifth"] = 7] = "PerfectFifth";
    Intervals[Intervals["MinorSixth"] = 8] = "MinorSixth";
    Intervals[Intervals["MajorSixth"] = 9] = "MajorSixth";
    Intervals[Intervals["MinorSeventh"] = 10] = "MinorSeventh";
    Intervals[Intervals["MajorSeventh"] = 11] = "MajorSeventh";
})(Intervals || (Intervals = {}));
var Relationships;
(function (Relationships) {
    Relationships[Relationships["Tonic"] = 0] = "Tonic";
    Relationships[Relationships["Supertonic"] = 1] = "Supertonic";
    Relationships[Relationships["Mediant"] = 2] = "Mediant";
    Relationships[Relationships["Subdominant"] = 3] = "Subdominant";
    Relationships[Relationships["Dominant"] = 4] = "Dominant";
    Relationships[Relationships["Submediant"] = 5] = "Submediant";
    Relationships[Relationships["Leading"] = 6] = "Leading";
})(Relationships || (Relationships = {}));
var Waves;
(function (Waves) {
    Waves[Waves["sine"] = 0] = "sine";
    Waves[Waves["square"] = 1] = "square";
    Waves[Waves["sawtooth"] = 2] = "sawtooth";
    Waves[Waves["triangle"] = 3] = "triangle";
})(Waves || (Waves = {}));
let transpose = (freq, steps) => {
    // Use `NaN` to represent a rest
    // if ( isNaN(freq)) 
    //   return 0
    let modTable = transpositionMap();
    let bound = modTable.length - 1;
    if (steps <= bound) {
        return freq * modTable[steps];
    }
    steps = steps - bound;
    return transpose(transpose(freq, bound), steps);
};
// adapted from wikipedia (Interval, music theory)
// risig is the type of tritone to select. true for rising, false for falling 
let transpositionMap = (rising = true) => [1, (16 / 15), (9 / 8), (6 / 5), (5 / 4), (4 / 3), rising ? (45 / 32) : (25 / 18)];

const ac = new AudioContext();
const delay = ac.createDelay(4);
delay.delayTime.value = (60 / 120 / 4); //quarter note at 120bpm
// const source = ac.createBufferSource();
// source.buffer = buffers[2];
// source.loop = true;
// source.start();
// source.connect(delay);
delay.connect(ac.destination);
function Sequence(tempo, notes = []) {
    this.ac = ac;
    this.createFxNodes();
    this.tempo = tempo || 120;
    this.loop = true;
    this.smoothing = 0;
    this.staccato = 0;
    this.notes = notes;
}
// create gain and EQ nodes, then connect 'em
Sequence.prototype.createFxNodes = function () {
    const eq = [['bass', 100], ['mid', 1000], ['treble', 2500]];
    let prev = this.gain = this.ac.createGain();
    eq.forEach(function (config, fx) {
        fx = this[config[0]] = this.ac.createBiquadFilter();
        fx.type = 'peaking';
        fx.frequency.value = config[1];
        prev.connect(prev = fx);
    }.bind(this));
    this.lp = this.ac.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.frequency.value = 15000;
    prev.connect(prev = this.lp);
    this.hp = this.ac.createBiquadFilter();
    this.hp.type = 'highpass';
    this.hp.frequency.value = 80;
    prev.connect(prev = this.hp);
    prev.connect(this.ac.destination);
    return this;
};
// recreate the oscillator node (happens on every play)
Sequence.prototype.createOscillator = function () {
    this.stop();
    this.osc = this.ac.createOscillator();
    this.osc.type = this.waveType || 'square';
    this.gain.value = 0.1;
    if (this.type == 'lead') {
        this.osc.connect(delay);
        this.osc.connect(this.ac.destination);
        this.osc.connect(this.ac.destination);
    }
    this.osc.connect(this.gain);
    return this;
};
// schedules this.notes[ index ] to play at the given time
// returns an AudioContext timestamp of when the note will *end*
Sequence.prototype.scheduleNote = function (index, when) {
    const duration = 60 / this.tempo * this.notes[index][1], cutoff = duration * (1 - (this.staccato || 0));
    this.setFrequency(this.notes[index][0], when);
    if (this.smoothing && this.notes[index][0]) {
        this.slide(index, when, cutoff);
    }
    this.setFrequency(0, when + cutoff);
    return when + duration;
};
// get the next note
Sequence.prototype.getNextNote = function (index) {
    return this.notes[index < this.notes.length - 1 ? index + 1 : 0];
};
// how long do we wait before beginning the slide? (in seconds)
Sequence.prototype.getSlideStartDelay = function (duration) {
    return duration - Math.min(duration, 60 / this.tempo * this.smoothing);
};
// slide the note at <index> into the next note at the given time,
// and apply staccato effect if needed
Sequence.prototype.slide = function (index, when, cutoff) {
    const next = this.getNextNote(index), start = this.getSlideStartDelay(cutoff);
    this.setFrequency(this.notes[index][0], when + start);
    this.rampFrequency(next[0], when + cutoff);
    return this;
};
Sequence.prototype.setFrequency = function (freq, when) {
    this.osc.frequency.setValueAtTime(freq, when);
    return this;
};
Sequence.prototype.rampFrequency = function (freq, when) {
    this.osc.frequency.linearRampToValueAtTime(freq, when);
    return this;
};
// run through all notes in the sequence and schedule them
Sequence.prototype.play = function (when) {
    when = typeof when === 'number' ? when : this.ac.currentTime;
    this.createOscillator();
    this.osc.start(when + 1);
    this.notes.forEach(function (note, i) {
        when = this.scheduleNote(i, when);
    }.bind(this));
    this.osc.stop(when);
    return this;
};
// stop playback, null out the oscillator, cancel parameter automation
Sequence.prototype.stop = function () {
    if (this.osc) {
        this.osc.stop(0);
        this.osc.frequency.cancelScheduledValues(0);
        this.osc = null;
    }
    return this;
};
const intervalsToMelody = (root, duration = (i) => 1, intervals = []) => intervals.map((interval, i) => ([isNaN(interval) ? 0 : transpose(root, interval), duration(i)]));
const partLead = (when, tempo, melody) => {
    const seq = new Sequence(tempo, melody);
    seq.staccato = 0.55;
    seq.gain.gain.value = 1.0;
    seq.bass.frequency.value = 400;
    seq.bass.gain.value = -4;
    seq.mid.frequency.value = 800;
    seq.mid.gain.value = 3;
    seq.waveType = 'square';
    seq.hp.frequency.value = 1200;
    seq.role = 'lead';
    return function play() {
        seq.play(when);
        return seq;
    };
};
const partHarmony = (when, tempo, melody) => {
    const seq = new Sequence(tempo, melody);
    seq.mid.frequency.value = 1200;
    seq.gain.gain.value = 0.8;
    seq.staccato = 0.55;
    seq.waveType = 'triangle';
    return function play() {
        seq.play(when);
        return seq;
    };
};
const partBass = (when, tempo, melody) => {
    const seq = new Sequence(tempo, melody);
    seq.staccato = 0.05;
    seq.smoothing = 0.05;
    seq.gain.gain.value = 0.65;
    seq.mid.gain.value = 3;
    seq.bass.gain.value = 6;
    seq.bass.frequency.value = 80;
    seq.mid.gain.value = -2;
    seq.mid.frequency.value = 500;
    seq.treble.gain.value = -4;
    seq.treble.frequency.value = 1400;
    seq.waveType = 'square';
    return function play() {
        seq.play(when);
        return seq;
    };
};
function getBeatIndex(time, bpm, notes = []) {
    const beatDuration = getBeatLength(bpm);
    const barDuration = beatDuration * notes.length;
    const location = time % barDuration;
    return notes.findIndex((note, i) => location <= ((i + 1) * beatDuration));
}
function getBeatLength(bpm) {
    return (60 / bpm);
}

const { abs, sin, cos, pow, sqrt, floor, ceil, random, PI, max, min } = Math;
var Role;
(function (Role) {
    Role[Role["bass"] = 0] = "bass";
    Role[Role["tenor"] = 1] = "tenor";
    Role[Role["alto"] = 2] = "alto";
    Role[Role["soprano"] = 3] = "soprano";
})(Role || (Role = {}));
var Clan;
(function (Clan) {
    Clan[Clan["Blue"] = 0] = "Blue";
    Clan[Clan["Red"] = 1] = "Red";
    Clan[Clan["Yellow"] = 2] = "Yellow";
})(Clan || (Clan = {}));
// # Game Data 
const clanAttributes = { [Clan.Red]: { rgb: [255, 0, 0]
    },
    [Clan.Blue]: { rgb: [0, 0, 255]
    },
    [Clan.Yellow]: { rgb: [0, 255, 0]
    }
};
const roleAttributes = { [Role.bass]: { colorMod(n, time) { return n == 255 ? 50 : n; },
        text: '#'
    },
    [Role.tenor]: { colorMod(n, time) { return n == 255 ? 100 : n; },
        text: '\\-'
    },
    [Role.alto]: { colorMod(n, time) { return n == 255 ? 175 : n; },
        text: '=/'
    },
    [Role.soprano]: { colorMod(n, time) { return 255; },
        text: '@' }
};
const Presets = { [Clan.Yellow]: { tonic: 88,
        bpm: 70,
        voices: { [Role.bass]: [0, 5, 0, 7],
            [Role.tenor]: [0, 5, NaN, 5],
            [Role.alto]: [7, 2, NaN],
            [Role.soprano]: [12, 4, NaN, 12, 7, NaN, 4, 7]
        }
    },
    [Clan.Red]: { tonic: 52,
        bpm: 93.333,
        voices: { [Role.bass]: [7, 0],
            [Role.tenor]: [4, 4, 2, 4],
            [Role.alto]: [7, 4, 7, NaN],
            [Role.soprano]: [12, NaN, NaN, 0]
        }
    },
    [Clan.Blue]: { tonic: 128,
        bpm: 124.44 / 2,
        voices: { [Role.bass]: [12, 0, NaN, 0],
            [Role.tenor]: [0, 4, 0],
            [Role.alto]: [7, NaN, 12],
            [Role.soprano]: [4, NaN, NaN, 12, 7, 4, 7, NaN]
        }
    }
};
const Songs = { "opening": { tonic: 84,
        bpm: 132,
        voices: { [Role.bass]: [0, NaN, 0, 3, 0, NaN, 0, 4, 0, NaN, 0, 7, 9, 5, 7, 2],
            [Role.tenor]: [3, 3, 3, 3, 4, 4, 4, 4, 7, 7, 7, 7, 10, 10, 10, 10],
            [Role.alto]: [NaN, 5, NaN, 5, NaN, 7, NaN, 7, NaN, 2, NaN, 2, NaN, 5, NaN, 5],
            [Role.soprano]: [10, NaN, NaN, NaN, 11, NaN, NaN, NaN, NaN, 11, NaN, NaN, NaN, NaN, 10, NaN, NaN, NaN, NaN,]
        }
    }
};
const mods = [(t, state) => floor(downScale(t, (state.level * 2) + 5) % 255),
    (t, state) => floor(downScale(t, 51 + state.level) % 255),
    (t, state) => floor(downScale(t, 91 - state.level) % 255),
    (t, state) => floor(t + 223 % 20)];
const useMod = (n, time, state) => mods[n % mods.length](time, state);
const collides = (unit, obj) => {
    if (unit.objectID == obj.objectID)
        return false;
    return !(unit.x > obj.x + obj.width ||
        unit.x + obj.width < obj.x ||
        unit.y > obj.y + obj.height ||
        unit.y + obj.height < obj.y);
};
const applyDroneDamage = (role, ensemble) => {
    const next = Object.assign({}, ensemble);
    const mirrors = [[Role.bass, Role.soprano],
        [Role.tenor, Role.alto]];
    let dmg = 0;
    for (let duo of mirrors) {
        if (duo.includes(role)) {
            dmg = (duo[0] == role)
                ? 1
                : 2;
            next[role].volume = next[role].volume - dmg;
        }
    }
    return next;
};
const touchHandlers = { drone(state, touches) {
        const ensemble = touches.reduce((ensemble, drone) => applyDroneDamage(state.room.role, state.ensemble), touches);
        const defenderIDs = touches.map(drone => drone.objectID);
        // destroy on contact
        const drones = state.drones.filter(drone => !defenderIDs.includes(drone.objectID));
        return Object.assign(Object.assign({}, state), { drones, ensemble });
    },
    element(state, touches) {
        if (state.level == 0 && touches.length > 1) {
            // prevent multiple collisions when there are 3 nodes
            return state;
        }
        const element = touches[0];
        const room = { clan: element.clan,
            role: (state.level == 0) ? Role.bass : element.role };
        const ensemble = addToEnsemble(state.ensemble, room.clan, room.role);
        return (Object.assign(Object.assign({}, state), { ensemble,
            room, drops: [], level: state.level + 1 }));
    }
};
const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight;
const playerHeight = 80;
const playerWidth = 80;
const droneWidth = 50;
const droneHeight = 50;
const elementRadius = min(100, canvasWidth / 6);
const config = {
    canvasWidth,
    canvasHeight
};
const objectID = () => {
    return objectID.prev++;
};
objectID.prev = 0;
const downScale = (n, scale = 3) => n * pow(10, -(scale));
const aN = n => (!isNaN(n) && typeof n == 'number');
const toColor = (rgb, mod = (n, time) => n) => {
    if (rgb.length != 3) {
        return '';
    }
    const [r, g, b] = rgb.map(mod).map(n => n.toString());
    return `rgb(${r},${g},${b})`;
};
const randomInt = (min = 0, max = 1) => floor(random() * (floor(max) - ceil(min) + 1)) + ceil(min);
const coinToss = () => (Math.random() < 0.5);
const walk = (u, step = 1) => {
    let direction = u.lastwalk ? 'x' : 'y';
    return (Object.assign(Object.assign({}, u), { lastwalk: !u.lastwalk, [direction]: coinToss() ? u[direction] + 1 : u[direction] - 1 }));
};
const moveLeft = (u, amt = 7) => (Object.assign(Object.assign({}, u), { x: u.x > 0 ? u.x -= amt : 0 }));
const moveRight = (u, amt = 7) => (Object.assign(Object.assign({}, u), { x: u.x < (canvasWidth - playerWidth) ? u.x += amt : (canvasWidth - playerWidth) }));
const moveUp = (u, amt = 7) => (Object.assign(Object.assign({}, u), { y: u.y >= (0) ? u.y -= amt : playerHeight }));
const moveDown = (u, amt = 7) => (Object.assign(Object.assign({}, u), { y: u.y <= (canvasHeight) ? u.y += amt : (canvasHeight) }));
const createShot = (opts = {}) => {
    return (Object.assign({ objectID: objectID(), name: 'shot', x: 0, y: 0, radius: 0, dr: (time, shot, index) => {
            const maxRadius = floor(canvasWidth / 3);
            const progress = (+new Date - shot.start) / (shot.duration);
            if (progress > 1) {
                return 0;
            }
            return floor(maxRadius * progress);
        }, start: (+new Date), duration: 2000 }, opts));
};
const createPlayer = () => {
    return ({ objectID: objectID(),
        name: 'player',
        width: playerWidth,
        height: playerHeight,
        x: (canvasWidth) / 2,
        y: canvasHeight / 5,
        volume: 100,
        speed: 100,
        luck: 100
    });
};
const createDrone = (defaults = {}) => {
    const bias = 0.7; // favor the center of the room
    return Object.assign({ objectID: objectID(),
        name: 'drone',
        x: bias * Math.random() * canvasWidth,
        y: bias * Math.random() * canvasHeight,
        width: 40,
        height: 40,
        lastwalk: false
    }, defaults);
};
const createOpeningMusicDrops = (qty = 3) => {
    const drops = [];
    const containerWidth = canvasWidth * 2 / qty;
    const offsetWall = canvasWidth / qty;
    const offsetCeiling = (canvasHeight + elementRadius) / 2;
    const elWidth = containerWidth / qty;
    for (let i = 0; i < 3; i++) {
        const x = offsetWall + (i * elWidth);
        const y = offsetCeiling;
        drops.push(createMusicDrop({ x, y, role: Role.bass, clan: Clan[Clan[i]] }));
    }
    return drops;
};
const createMusicDrop = (opts = {}) => {
    return (Object.assign(Object.assign({ clan: '', x: 0, y: 0, radius: elementRadius, dr: (time, element) => floor(elementRadius * abs(sin((element.objectID) + downScale(time)))), width: 0, height: 0 }, opts // do not allow name or objectID to be initialized
    ), { name: 'element', objectID: objectID() }));
};
const motionControls = () => ({ ArrowRight: moveRight,
    ArrowLeft: moveLeft,
    ArrowDown: moveDown,
    ArrowUp: moveUp
});
const applyMotion = (player, controlKey) => {
    let map = motionControls();
    if (!(Object.keys(map).includes(controlKey)))
        return player;
    return map[controlKey](player);
};
/* Respond to the keydown controls */
const applyControls = (time, state) => {
    const renderOffset = 0;
    let shots = state.shots;
    if (game.controls.includes('f')) {
        shots = shots.concat(createShot({ start: (+new Date), x: state.player.x, y: state.player.y, duration: 200 }));
        game.controls = game.controls.filter(k => k != 'f');
    }
    const isInProgress = (shot) => 1 !== (floor((+new Date) / (shot.start + (shot.duration + renderOffset))));
    return (Object.assign(Object.assign({}, state), { shots: shots.filter(isInProgress), player: game.controls.reduce(applyMotion, state.player) }));
};
const updateRadial = (unit, time) => {
    const radius = unit.dr(time, unit);
    return Object.assign(Object.assign({}, unit), { radius, width: radius / 2, height: radius / 2 });
};
/* Update the x,y,width,height,radius properties of units in state. */
const applyPositions = (time, state) => {
    return Object.assign(Object.assign({}, state), { shots: state.shots.map((u) => updateRadial(u, +new Date)), drops: state.drops.map((u) => updateRadial(u, time)), drones: state.drones.map(walk) });
};
const applyToTree = (tree, u) => {
    tree.insert(u);
    return tree;
};
/* Global handler for store state updates */
const updateTreeIndices = (time, state, tree) => {
    return ([state.player,
        ...state.drones,
        ...state.drops,
        ...state.shots]).reduce(applyToTree, tree);
};
const handlePlayerCollisions = (state, tree) => {
    const droneHits = state.drones.reduce((collisions, drone) => {
        const intersections = tree.retrieve(drone).filter((unit) => collides(unit, drone));
        return collisions.concat(intersections);
    }, []);
    const playerHits = tree.retrieve(state.player).filter((u) => collides(u, state.player));
    return [...playerHits, ...droneHits];
};
const addToEnsemble = (ensemble, clan, key, amt = 2) => {
    if (ensemble[key].clan != clan) {
        const preset = Presets[clan];
        // Swap the previous type with the new one
        ensemble[key].clan = clan;
        ensemble[key].volume = amt;
        ensemble[key].bpm = preset.bpm;
        ensemble[key].tonic = preset.tonic;
        ensemble[key].melody = preset.voices[key];
    }
    else {
        ensemble[key].volume += amt;
    }
    return ensemble;
};
function getSynth(role) {
    const roles = { [Role.bass]: partBass,
        [Role.tenor]: partHarmony,
        [Role.alto]: partLead,
        [Role.soprano]: partHarmony
    };
    return (roles[role] || partHarmony);
}
// reindexes the list to start at `index`
function beatmatch(index, list) {
    return [...list.concat().slice(index, list.length), ...list.concat().slice(0, index)];
}
const choppy = x => 0.5;
const shortening = x => {
    let duration = 1 / (x + 1);
    return duration;
};
const tenuto = x => 0.85;
const sostenuto = x => 0.99;
const getDuration = (role) => {
    const roles = { [Role.bass]: choppy,
        [Role.tenor]: tenuto,
        [Role.alto]: shortening,
        [Role.soprano]: sostenuto
    };
    return (roles[role] || tenuto);
};
function game() {
    const state = { player: createPlayer(), ensemble: { [Role.bass]: { volume: 1 },
            [Role.tenor]: { volume: 1 },
            [Role.alto]: { volume: 1 },
            [Role.soprano]: { volume: 1 }
        }, drones: [],
        shots: [],
        drops: createOpeningMusicDrops(), room: { clan: null, role: Role.bass }, level: 0 };
    const play = (now, role, part) => {
        var _a;
        if (part.volume == 1) {
            if (typeof part.sequencer != 'undefined') {
                part.sequencer.stop();
                delete part.sequencer;
            }
            return;
        }
        const synth = getSynth(role);
        const beat = getBeatIndex(now, part.bpm, part.melody);
        // start the first one
        if (typeof part.sequencer == 'undefined') {
            const notes = intervalsToMelody(part.tonic, getDuration(role), beatmatch(beat, part.melody));
            const play = synth(now, part.bpm, notes);
            part.sequencer = play();
            part.sequencer.osc.onended = () => {
                delete part.sequencer;
            };
            return;
        }
        // set up the next loop
        if ((typeof ((_a = part === null || part === void 0 ? void 0 : part.sequencer) === null || _a === void 0 ? void 0 : _a.osc.onended) == 'undefined') && beat == (part.melody.length - 1)) {
            const beatWidth = getBeatLength(part.bpm);
            const notes = intervalsToMelody(part.tonic, getDuration(role), part.melody);
            part.sequencer.osc.onended = () => {
                delete part.sequencer;
            };
        }
    };
    const playMusicEnsemble = (now, ensemble) => {
        Object.entries(ensemble).forEach(([key, part]) => play(now, parseInt(key), part));
    };
    const updateSound = (state, ctx) => {
        // if ( state.level == 0 ) {
        //   playMusicEnsemble(ctx.currentTime, Songs.opening)
        // } else {
        playMusicEnsemble(ctx.currentTime, state.ensemble);
        // }
    };
    const drawNPCS = (time, state) => {
        const cAttrs = clanAttributes[state.room.clan];
        const rAttrs = roleAttributes[state.room.role];
        // use measuretext here because it depends on the ctx
        // it is a sidefx that should go in applyMotion instead
        return (ctx) => {
            state.drones.forEach((drone, i) => {
                const { x, y } = drone;
                const text = rAttrs.text.repeat(2);
                const metrics = ctx.measureText(text);
                drone.width = metrics.width;
                ctx.fillStyle = toColor(cAttrs.rgb, rAttrs.colorMod);
                ctx.fillText(text, floor(x + droneWidth), floor(y + droneHeight));
            });
        };
    };
    const drawShots = (time, state) => {
        return (ctx) => {
            state.shots.forEach((shot, i) => {
                ctx.strokeStyle = toColor([(shot.x + shot.y) % 100, shot.x % 255, shot.y % 200]);
                ctx.arc(shot.x, shot.y, shot.radius, 0, 2 * PI);
                ctx.lineWidth = (time % 20);
                ctx.stroke();
            });
        };
    };
    const drawDrops = (time, state) => {
        const rgb = [0, 0, 0];
        return (ctx) => {
            drawDoors(ctx, state.room.clan);
            state.drops.forEach(({ x, y, width, height }, i) => {
                for (let j = 0; j < 3; j++) {
                    rgb[i] = 255;
                    const offset = +downScale(time) + (PI * j / 4);
                    const endpoint = (Math.PI / 4) + offset;
                    ctx.fillStyle = toColor(rgb);
                    ctx.arc(x, y, 30, offset, endpoint);
                    ctx.stroke();
                    ctx.fill();
                }
            });
        };
    };
    const drawPlayer = (time, state) => {
        const mainColor = 'white';
        const accent = 'black';
        const text = '!*!' ;
        return (ctx) => {
            const metrics = ctx.measureText(text);
            state.player.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            state.player.width = metrics.width;
            // Must apply width and height using the ctx
            ctx.fillStyle = mainColor;
            ctx.strokeStyle = accent;
            ctx.strokeText(text, state.player.x, state.player.y);
            ctx.fillText(text, state.player.x, state.player.y);
        };
    };
    const drawTiles = (time, ctx, state) => {
        let tw = 30;
        let th = 30;
        let nx = canvasWidth / tw;
        let ny = canvasHeight / th;
        for (let i = 0; i < nx; i++) {
            let r = (i * downScale(time, 3)) % 255;
            // let r = useMod(i,time,state)
            for (let j = 0; j < ny; j++) {
                let g = useMod(j, time, state);
                let b = useMod(i + j, time, state);
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(i * tw - i, j * th - j, i * tw + tw, j * tw + tw);
            }
        }
    };
    const drawDoors = (ctx, clan) => {
        let altClans = Object.keys(Clan).map(a => parseInt(a)).filter(c => c !== clan).filter(aN);
        let doorHeight = 40;
        let offsetWall = 0;
        let doorWidth = 20;
        let offsetCeiling = (canvasHeight - doorHeight) / 3;
        // left door
        ctx.fillStyle = toColor(clanAttributes[altClans[0]].rgb);
        ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight);
        // right door
        ctx.fillStyle = toColor(clanAttributes[altClans[1]].rgb);
        ctx.fillRect(canvasWidth - offsetWall - doorWidth, offsetCeiling, canvasWidth - offsetWall + doorWidth, offsetCeiling + doorHeight);
    };
    const drawRoom = (time, state) => {
        // let selection = floor(downScale(time,3))%4
        // let render = (
        //   [ drawTiles
        //   , drawTiles2
        //   , drawTiles3
        //   , drawTiles4
        //   ])[selection]
        return (ctx) => {
            drawTiles(time, ctx, state);
        };
    };
    const handleKeydown = (e, time, state) => {
        if (e.repeat === true) {
            return;
        }
        if (e.key == 'f' && game.controls.includes(e.key)) {
            game.controls = game.controls.filter(k => k !== e.key);
        }
        else {
            game.controls = game.controls.concat(e.key);
        }
        const remove = () => {
            game.controls = game.controls.filter(k => k !== e.key);
        };
        const cleanup = (ev) => {
            if (e.key === ev.key) {
                remove();
                window.removeEventListener('keyup', cleanup);
            }
        };
        window.addEventListener('keyup', cleanup);
    };
    const getDrones = (qty = 4, drones = []) => {
        if (qty === 0)
            return drones;
        drones = drones.concat(createDrone());
        return getDrones(qty - 1, drones);
    };
    const drawStage = (time, state, illustrate) => {
        illustrate((ctx) => ctx.clearRect(0, 0, canvasWidth, canvasHeight));
        if (state.level == 0) {
            openingScene(time, state, illustrate);
            illustrate(drawShots(time, state));
            return;
        }
        if (state.drops.length > 0) {
            dropScene(time, state, illustrate);
        }
        else {
            swarmScene(time, state, illustrate);
        }
    };
    const swarmScene = (time, state, illustrate) => {
        illustrate(drawRoom(time, state));
        illustrate(drawNPCS(time, state));
        illustrate(drawShots(time, state));
        illustrate(drawPlayer(time, state));
    };
    const dropScene = (time, state, illustrate) => {
        // illustrate( drawRoom(time, state) )
        illustrate(drawDrops(time, state));
        illustrate(drawPlayer(time, state));
    };
    const updateListeners = (time, state) => {
        const listener = (e) => handleKeydown(e);
        if (typeof updateListeners.prev == 'function')
            window.removeEventListener('keydown', updateListeners.prev);
        window.addEventListener('keydown', updateListeners.prev = listener);
        return state;
    };
    const applyPlayerCollisions = (state, touches, type = '') => {
        if (type === '')
            type = touches[0].name;
        const action = touchHandlers[type];
        if (typeof action == 'undefined') {
            // TODO applyPlayerCollisions sould be explicitly called with known arguments
            return state;
        }
        return action(state, touches);
    };
    const enumKeys = (e) => Object.keys(e).map(a => parseInt(a)).filter(aN);
    /** Create a room with new values compared to a previous room. */
    const nextRoom = (pClan, pRole) => {
        const altClans = enumKeys(Clan).filter(k => k != pClan);
        const altRoles = enumKeys(Role).filter(k => k != pRole);
        const clan = altClans[randomInt(0, altClans.length - 1)];
        const role = altRoles[randomInt(0, altRoles.length - 1)];
        return { clan, role };
    };
    const setupNextLevel = (state) => {
        const room = nextRoom(state.room.clan, state.room.role);
        const drones = getDrones(state.level * 2);
        return Object.assign(Object.assign({}, state), { drones, room });
    };
    const setupDrops = (state) => {
        // const unit = f({x, y, width: radius, height: radius, clan: Clan[i]})
        const element = createMusicDrop({ name: 'element',
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            clan: state.room.clan,
            role: state.room.role
        });
        return Object.assign(Object.assign({}, state), { drops: [element] });
    };
    const loop = (time, prev, draw, tree) => {
        tree.clear();
        let next = applyControls(time, prev);
        next = applyPositions(time, next);
        tree = updateTreeIndices(time, next, tree);
        updateSound(next, ac);
        let collisions = handlePlayerCollisions(next, tree);
        if (collisions.length > 0) {
            next = applyPlayerCollisions(next, collisions);
        }
        if (next.shots.length > 0 && next.drones.length > 0) {
            // shoot at the drones, remove the hits
            let drones = next.shots.reduce((drones, shot, i) => {
                const collisions = tree.retrieve(shot).filter((unit) => collides(unit, shot));
                return drones.filter(drone => !collisions.includes(drone));
            }, next.drones);
            // next = applyShotCollisions(next, tree)
            next = Object.assign(Object.assign({}, next), { drones });
        }
        // you died
        if (Object.values(next.ensemble).some(part => part.volume == 0)) {
            location.reload();
        }
        if (prev.level != next.level) {
            next = setupNextLevel(next);
        }
        else if (next.drones.length == 0 && next.drops.length == 0) {
            // The room is clear, provide the drops
            next = setupDrops(next);
        }
        updateListeners(time, next);
        drawStage(time, next, draw);
        requestAnimationFrame((ntime) => loop(ntime, next, draw, tree));
    };
    const playback = (state, tick, config) => {
        const { canvasWidth, canvasHeight } = config;
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.font = '50px monospace';
        document.body.appendChild(canvas);
        const scene = (draw) => {
            ctx.beginPath();
            ctx.lineWidth = 8;
            draw(ctx);
            ctx.closePath();
        };
        const tree = new Quadtree({ x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);
        tick(0, state, scene, tree);
    };
    const openingScene = (time, state, illustrate) => {
        const clans = enumKeys(Clan);
        const containerWidth = canvasWidth * 2 / 3;
        const elWidth = containerWidth / clans.length;
        illustrate((ctx) => drawTiles(time, ctx, state));
        state.drops.forEach((unit, i) => {
            illustrate((ctx) => {
                const attrs = clanAttributes[i];
                const rAttrs = roleAttributes[i];
                ctx.fillStyle = ctx.strokeStyle = toColor(attrs.rgb, rAttrs[i]);
                ctx.arc(unit.x, unit.y, unit.radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            });
        });
        illustrate(drawPlayer(time, state));
    };
    playback(state, loop, config);
}
/**
the game state must be aware of current global baseline bpm and measure number
it does not need a record of it


*/
// todo decide if it is worth having a global async controls or use something else
game.controls = [];
game();
