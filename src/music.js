"use strict";
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.setup = exports.play = exports.createGenericProgression = exports.createParts = exports.transpose = void 0;
var pitch_frequencies_1 = require("./pitch-frequencies");
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
var translatePitch = function (pitch) {
    switch (pitch) {
        case "Cs":
        case "C#":
        case "C sharp":
        case "C Sharp":
            return PitchClass.Cs;
        case "D":
            return PitchClass.D;
        case "Ds":
        case "D#":
        case "D sharp":
        case "D Sharp":
            return PitchClass.Ds;
        case "E":
            return PitchClass.E;
        case "F":
            return PitchClass.F;
        case "Fs":
        case "F#":
        case "F sharp":
        case "F Sharp":
            return PitchClass.Fs;
        case "G":
            return PitchClass.G;
        case "Gs":
        case "G#":
        case "G sharp":
        case "G Sharp":
            return PitchClass.Gs;
        case "A":
            return PitchClass.A;
        case "As":
        case "A#":
        case "A sharp":
        case "A Sharp":
            return PitchClass.As;
        case "B":
            return PitchClass.B;
    }
};
var print = function () {
    var any = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        any[_i] = arguments[_i];
    }
    return console.log(any);
};
var next = function (limit, list, mod, n) {
    if (limit === void 0) { limit = 1; }
    if (list === void 0) { list = []; }
    if (n === void 0) { n = 0; }
    if (list.length == limit)
        return list;
    var prev = list[list.length - 1];
    var newx = mod(n, prev, list[0]);
    return next(limit, list.concat(newx), mod, n + 1);
};
exports.transpose = function (freq, steps) {
    var modTable = transpositionMap();
    var bound = modTable.length - 1;
    if (steps <= bound) {
        return freq * modTable[steps];
    }
    steps = steps - bound;
    return exports.transpose(exports.transpose(freq, bound), steps);
};
var chordByFreq = function (freq) {
    return function (quality) {
        if (quality === void 0) { quality = 'major'; }
        return qualities()[quality](freq);
    };
};
var octaveSeries = function (startFreq, qty) {
    if (startFreq === void 0) { startFreq = 32; }
    if (qty === void 0) { qty = 10; }
    return next(qty, [startFreq], function (n, prev, first) { return prev * 2; });
};
var getHarmonicSeries = function (startFreq, qty) {
    if (startFreq === void 0) { startFreq = 32; }
    if (qty === void 0) { qty = 10; }
    return next(qty, [], function (n, prev, first) { return (n == 0 ? startFreq : (prev * (1 + n)) / n); });
};
var selectHarmonicPoints = function (frequencies, n) {
    if (n === void 0) { n = 0; }
    return frequencies.reduce(function (selections, freq, index) {
        var amtToSkip = selections.length;
        if (n == amtToSkip) {
            n = 0;
            return selections.concat(freq);
        }
        n++;
        return selections;
    }, []);
};
var pitchclassToNote = function (p) {
    if (typeof p == 'string')
        return p;
    var note = PitchClass[p];
    // while (note > PitchClass.length)
    //   note = note - PitchClass.length
    return note;
};
var pitchOctave = function (pitch, octave) {
    if (octave === void 0) { octave = 5; }
    return "" + pitch + octave.toString();
};
var nameToFreq = function (pitchclass) {
    return (pitch_frequencies_1.frequencies[pitchOctave(pitchclass)] || 0);
};
// adapted from wikipedia (Interval, music theory)
// risig is the type of tritone to select. true for rising, false for falling 
var transpositionMap = function (rising) {
    if (rising === void 0) { rising = true; }
    return [1, (16 / 15), (9 / 8), (6 / 5), (5 / 4), (4 / 3), rising ? (45 / 32) : (25 / 18)];
};
var createMajorChord = function (freq) {
    return [freq,
        exports.transpose(freq, 4),
        exports.transpose(freq, 7)];
};
var createMinorChord = function (freq) {
    return [freq,
        exports.transpose(freq, 3),
        exports.transpose(freq, 7)];
};
var createAugmentedChord = function (freq) {
    return [freq,
        exports.transpose(freq, 4),
        exports.transpose(freq, 8)];
};
var createDiminishedChord = function (freq) {
    return [freq,
        exports.transpose(freq, 3),
        exports.transpose(freq, 6)];
};
var createDominantChord = function (freq) {
    return [freq,
        exports.transpose(freq, 4),
        exports.transpose(freq, 10)];
};
var harmonicProgression = function (fundamental) {
    if (fundamental === void 0) { fundamental = 32; }
    var fundamentals = getHarmonicSeries(fundamental);
    return fundamentals;
};
var selectHarmonicRelatives = function (tonic, relatives) {
    var r = { supertonic: Intervals.MajorSecond,
        mediant: Intervals.MajorThird,
        subdominant: Intervals.PerfectFourth,
        dominant: Intervals.PerfectFifth,
        submediant: Intervals.MajorSixth,
        leading: Intervals.MajorSeventh };
    var keys = Object.keys(r);
    return relatives.reduce(function (selections, relative) {
        var _a;
        return (keys.includes(relative) ? __assign(__assign({}, selections), (_a = {}, _a[relative] = (tonic + r[relative]), _a)) : selections);
    }, { tonic: tonic });
};
var qualities = function () {
    return ({ major: createMajorChord,
        minor: createMinorChord,
        augmented: createAugmentedChord,
        diminished: createDiminishedChord,
        dominant: createDominantChord });
};
var getMode = function (state) {
    var _a = qualities(), major = _a.major, minor = _a.minor, augmented = _a.augmented, diminished = _a.diminished, dominant = _a.dominant;
    switch (state) {
        case 'major':
        default:
            return ({ tonic: major,
                supertonic: minor,
                mediant: minor,
                subdominant: major,
                dominant: dominant,
                submediant: minor,
                leading: diminished });
    }
};
exports.createParts = function (root, relationships, mode) {
    if (relationships === void 0) { relationships = ['subdominant', 'dominant']; }
    if (mode === void 0) { mode = 'major'; }
    var chordMap = getMode(mode);
    var relatives = selectHarmonicRelatives(PitchClass[root], relationships);
    var parts = {};
    // @ts-ignore
    Object.entries(relatives).forEach(function (_a) {
        var role = _a[0], pitchclass = _a[1];
        parts[role] =
            { name: role,
                note: pitchclassToNote(pitchclass),
                pitchclass: relatives[role],
                freq: exports.transpose(nameToFreq(root), relatives[role]),
                constructor: chordMap[role], get: function chord(octave) {
                    if (octave === void 0) { octave = 1; }
                    return this.constructor(parts[role].freq / 4 * (octave / 1));
                }
            };
    });
    return parts;
};
exports.createGenericProgression = function (root) {
    if (root === void 0) { root = "C"; }
    var parts = exports.createParts(root);
    var fill = function (chord) {
        return Array(4).fill(chord);
    };
    var tonic = parts.tonic.get(1);
    var subdominant = parts.subdominant.get(1);
    var dominant = parts.dominant.get(1);
    return ([fill(tonic),
        fill(subdominant),
        fill(dominant),
        [subdominant, dominant, subdominant, dominant]]);
};
var osc = function (ctx, opts) {
    if (opts === void 0) { opts = {}; }
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    gain.connect(ctx.destination);
    oscillator.connect(gain);
    oscillator.type = 'square';
    gain.volume = 0.1;
    oscillator.gain = gain;
    for (var o in opts)
        oscillator[o] = opts[o];
    return oscillator;
};
var enqueue = function (osc, freq, time) {
    return osc.frequency.setValueAtTime(freq, time);
};
// let createTrigger = (osc, freq: Freq) =>
//   (trigger, f?: Freq) =>
//     osc.frequency.setValueAtTime(f || freq, trigger());  
var ar = function (osc, freq, start, duration) {
    // osc.gain.volume = 0.8
    osc.frequency.value = freq;
    // setTimeout(osc.gain.volume=0),duration)
};
var playbackSequence = function (list, fn, loop) {
    if (loop === void 0) { loop = false; }
    var chain = list.reduce(fn, Promise.resolve());
    return (loop)
        ? chain.then(function () { return playbackSequence(list, fn, loop); })
        : chain;
};
var createTime = function (bpm, opts, n, d, _) {
    if (opts === void 0) { opts = {}; }
    if (n === void 0) { n = 4; }
    if (d === void 0) { d = 4; }
    if (_ === void 0) { _ = 0; }
    var beat = 60 / (bpm);
    var bar = n * beat;
    var ratio = function (a, b) {
        if (a === void 0) { a = n; }
        if (b === void 0) { b = d; }
        return a / b;
    };
    var time = { bpm: bpm,
        beat: beat,
        bar: bar,
        ratio: ratio, moment: _,
        numerator: n,
        denominator: d };
    return __assign(__assign({}, time), opts);
};
var playBar = function (bar, voices, time) {
    return new Promise(function (resolve, reject) {
        var phraseNum = 0;
        var sustain = 0.75;
        function schedule(notes, beat) {
            var beatStart = beat * time.beat;
            var timestamp = time.moment + beatStart;
            notes.forEach(function (freq, voice) {
                var osc = voices[voice];
                osc.frequency.setValueAtTime(freq, timestamp);
            });
            if (beat == (time.numerator - 1)) {
                phraseNum++;
            }
        }
        bar.forEach(function (noteStack, beat) { return schedule(noteStack, beat); });
        setTimeout(resolve, time.bar);
    });
};
exports.play = function (_a) {
    var ctx = _a.ctx, start = _a.start;
    var time = createTime({ bpm: 132,
        numerator: 4,
        denominator: 4,
        start: Date.now() - start });
    var chords = exports.createGenericProgression("F");
    var voices = chords.reduce(function (voices, bar, i) { return __spreadArrays(voices, [osc(ctx, { type: Waves[i] })]); }, []);
    var chainPlayback = function (chain, bar, index, list) {
        return chain.then(function () {
            return new Promise(function (resolve, reject) {
                var now = new Date();
                //@ts-ignore
                time.moment = now - start;
                playBar(bar, voices, time)
                    .then(resolve);
            });
        });
    };
    playbackSequence(chords, chainPlayback, true);
    voices.forEach(function (osc) { return osc.start(); });
};
exports.setup = function () {
    // @ts-ignore
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var start = Date.now();
    return function (event) { return exports.play({ ctx: ctx, start: start }); };
};
