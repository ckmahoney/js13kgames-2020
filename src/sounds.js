"use strict";
exports.__esModule = true;
var music_1 = require("./music");
console.log('got a transpose function');
console.log(music_1.transpose);
var ctx = new (window.AudioContext)();
var audioOut = ctx.createGain();
var melodies = {
    bass: [0, 0, 7, 5, 0, 0, 5, 7],
    tenor: [7, 7, 5, 11, 7, 4, 7, 9],
    alto: [4, 4, 0, 2, 4, 4, 7, 5],
    soprano: [11, 10, 9, 8, 7, 7, 5, 2]
};
var bpm = 105;
var beats = melodies.bass.length;
var beatDuration = (bpm / 60) * 1000;
var createParts = function (voices, tonic) {
    if (tonic === void 0) { tonic = 64; }
    return Object.values(voices).map(function (melody, i) {
        var voice = tonic * Math.pow(2, i);
        var osc = ctx.createOscillator();
        // @ts-ignore
        melody.setupNextScene = function (time, baseFreq, beatLength) {
            // @ts-ignore
            melody.forEach(function (interval, beat) {
                var pitch = music_1.transpose(baseFreq * voice, interval);
                var location = time + (beat * beatLength);
                osc.frequency.setValueAtTime(pitch, location);
            });
        };
    }, []);
};
var findBeatIndex = function (time, notes, ctx) {
    var barDuration = beatDuration * notes.length;
    var location = time % barDuration;
    return notes.findIndex(function (note, i) {
        return location <= (i + 1) * beatDuration;
    });
};
var loop = function (time, parts, ctx, tonic) {
    if (tonic === void 0) { tonic = 64; }
    parts.forEach(function (part) {
        // allows mixed length melodies
        var beat = findBeatIndex(time, part, ctx);
        if (beat == part.length - 1) {
            part.setupNextScene(time, tonic, beatDuration);
        }
    });
    requestAnimationFrame(function () { return loop(time, parts, ctx, tonic); });
};
console.log("typeof loop", typeof loop);
function play(parts) {
    console.log("typeof loop", typeof loop);
    loop(0, parts, ctx, 64);
    parts.forEach(function (part) { return part.start(); });
    console.log("started at " + +new Date);
}
document === null || document === void 0 ? void 0 : document.querySelector("#play").addEventListener('click', function () { return play(createParts(melodies)); });
// function createOscillator() {
//   var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//   // create Oscillator node
//   var oscillator = audioCtx.createOscillator();
//   oscillator.type = 'square';
//   oscillator.frequency.setValueAtTime(3000, audioCtx.currentTime); // value in hertz
//   oscillator.connect(audioCtx.destination);
//   oscillator.start();
// }
// each pattern is 8 beats long 
// it fills a specific part of the harmonic spectrum, indicated by the keys 
// the value represents selection from 1-4 in the harmonic series from the fundamental
// and each part is ofset by the range of selection (4)
// where `NaN` is a a rest
