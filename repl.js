/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/Composition.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/Composition.ts":
/*!****************************!*\
  !*** ./src/Composition.ts ***!
  \****************************/
/*! exports provided: randFrom, walk, walkingLine, createParts, createGenericProgression, part, playSpeciesCounterpoint, playArbitraryCounterpoint */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"randFrom\", function() { return randFrom; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"walk\", function() { return walk; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"walkingLine\", function() { return walkingLine; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"createParts\", function() { return createParts; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"createGenericProgression\", function() { return createGenericProgression; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"part\", function() { return part; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"playSpeciesCounterpoint\", function() { return playSpeciesCounterpoint; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"playArbitraryCounterpoint\", function() { return playArbitraryCounterpoint; });\n/* harmony import */ var _Pitches__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Pitches */ \"./src/Pitches.ts\");\n/* harmony import */ var _Intervals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Intervals */ \"./src/Intervals.ts\");\n/* harmony import */ var _Playback__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Playback */ \"./src/Playback.ts\");\n\n\n\nconst { round, random, pow, floor, ceil } = Math;\nvar Relationships;\n(function (Relationships) {\n    Relationships[Relationships[\"Tonic\"] = 0] = \"Tonic\";\n    Relationships[Relationships[\"Supertonic\"] = 1] = \"Supertonic\";\n    Relationships[Relationships[\"Mediant\"] = 2] = \"Mediant\";\n    Relationships[Relationships[\"Subdominant\"] = 3] = \"Subdominant\";\n    Relationships[Relationships[\"Dominant\"] = 4] = \"Dominant\";\n    Relationships[Relationships[\"Submediant\"] = 5] = \"Submediant\";\n    Relationships[Relationships[\"Leading\"] = 6] = \"Leading\";\n})(Relationships || (Relationships = {}));\nlet selectHarmonicRelatives = (tonic, relatives) => {\n    let r = { supertonic: _Intervals__WEBPACK_IMPORTED_MODULE_1__[\"Intervals\"].MajorSecond,\n        mediant: _Intervals__WEBPACK_IMPORTED_MODULE_1__[\"Intervals\"].MajorThird,\n        subdominant: _Intervals__WEBPACK_IMPORTED_MODULE_1__[\"Intervals\"].PerfectFourth,\n        dominant: _Intervals__WEBPACK_IMPORTED_MODULE_1__[\"Intervals\"].PerfectFifth,\n        submediant: _Intervals__WEBPACK_IMPORTED_MODULE_1__[\"Intervals\"].MajorSixth,\n        leading: _Intervals__WEBPACK_IMPORTED_MODULE_1__[\"Intervals\"].MajorSeventh };\n    let keys = Object.keys(r);\n    return relatives.reduce((selections, relative) => (Object.assign(Object.assign({}, selections), { [relative]: (tonic + r[relative]) })), { tonic });\n};\nlet randFrom = (arr) => {\n    if (arr.length < 1)\n        return;\n    let index = round(random() * (arr.length - 1));\n    return arr[index];\n};\nlet walk = (root, scale) => (beats, weights, acc = []) => {\n    if (acc.length == beats)\n        return acc;\n    const passingTones = scale.filter(n => !weights.includes(n));\n    // use a strong tone on strong beats; other tones on weak beats\n    const selection = (acc.length % 2 == 1)\n        ? randFrom(scale)\n        : randFrom(passingTones);\n    return walk(root, scale)(beats, weights, [...acc, Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(root, selection)]);\n};\nlet walkingLine = (root, mode = 'ionian', amt = 8) => {\n    const weights = [0, 3, 4]; // tonic points of a Western scale\n    const pitches = Object(_Intervals__WEBPACK_IMPORTED_MODULE_1__[\"scale\"])(mode);\n    const notes = [];\n    for (let i = 0; i < amt; i++) {\n        let selection;\n        if (i % 2 == 0) {\n            // use a weighted tone on strong beats\n            let index = round(random() * weights.length);\n            selection = weights[index];\n        }\n        else {\n            let index = round(random() * pitches.length);\n            selection = pitches[index];\n        }\n        notes[i] = selection;\n    }\n    return notes;\n};\nlet createParts = (root, relationships = ['subdominant', 'dominant'], mode = 'major') => {\n    let chordMap = Object(_Intervals__WEBPACK_IMPORTED_MODULE_1__[\"relation\"])(mode);\n    let relatives = selectHarmonicRelatives(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"PitchClass\"][_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"PitchClass\"][root]], relationships);\n    let parts = {};\n    // @ts-ignore\n    Object.entries(relatives).forEach(([role, pitchclass]) => {\n        parts[role] =\n            { name: role,\n                note: Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"pitchclassToNote\"])(pitchclass),\n                pitchclass: relatives[role],\n                freq: Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"pitch\"])(root), relatives[role]),\n                constructor: chordMap[role],\n                get: function chord(octave = 1) { return this.constructor(parts[role].freq / 4 * (octave / 1)); }\n            };\n    });\n    return parts;\n};\nlet createGenericProgression = (root = _Pitches__WEBPACK_IMPORTED_MODULE_0__[\"PitchClass\"].C) => {\n    let parts = createParts(root);\n    let fill = (chord) => Array(4).fill(chord);\n    let tonic = parts.tonic.get(1);\n    let subdominant = parts.subdominant.get(1);\n    let dominant = parts.dominant.get(1);\n    return ([fill(tonic),\n        fill(subdominant),\n        fill(dominant),\n        [subdominant, dominant, subdominant, dominant]]);\n};\nlet randNum = (min = 0, max = 1) => random() * (max - min) + min;\nlet randInt = (min = 0, max = 1) => floor(random() * (floor(max) - ceil(min) + 1) + ceil(min));\n// export const section = (root, quality, steps = 64, voices = 4, parts = []) => {\n//   if (parts.length == voices) \n//     return parts\n//   const melody = part(root, quality)\n//   return [...parts, melody(pitches, steps, parts.length)]\n// }\nconst part = (root, quality) => (pitches, steps, voice = 3) => {\n    const notes = walk(root * pow(2, voice), pitches);\n    const melody = notes(steps * pow(2, voice), quality(root * pow(2, voice)));\n    return melody;\n};\n// export const playSonataForm = () => {\n//   const now = audioCtx.currentTime\n//   const playback = sequencer(audioCtx)\n//   const bpm = 90\n//   const pitches = scale('major')\n//   const quality = chord('major')\n//   const steps = 13\n//   const exposition = createGenericProgression('Bb')\n//   const development = createGenericProgression('F')\n//   const recapitulation = createGenericProgression('D')\n// }\nlet magnitude = (num, order, base = 2) => num * pow(base, order);\nconst playSpeciesCounterpoint = (root = 415) => {\n    const now = _Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].currentTime;\n    const playback = Object(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"sequencer\"])(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"]);\n    const bpm = 108 / 4;\n    const pitches = Object(_Intervals__WEBPACK_IMPORTED_MODULE_1__[\"scale\"])('major');\n    const quality = Object(_Intervals__WEBPACK_IMPORTED_MODULE_1__[\"chord\"])('major');\n    const steps = 16;\n    const voices = 4;\n    // for Species Counterpoint\n    // use four independent lines each with different step lengths\n    const bass = playback(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].createOscillator(), bpm);\n    const tenor = playback(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].createOscillator(), bpm * 2);\n    const alto = playback(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].createOscillator(), bpm * 4);\n    const soprano = playback(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].createOscillator(), bpm * 8);\n    bass(now, walk(root / 4, pitches)(magnitude(steps, -2), quality(root / 4)))();\n    tenor(now, walk(root / 2, pitches)(magnitude(steps, -1), quality(root / 2)))();\n    alto(now, walk(root, pitches)(magnitude(steps, 0), quality(root)))();\n    // only one of the parts needs to trigger the callback\n    soprano(now, walk(root * 2, pitches)(magnitude(steps, 1), quality(root * 2)), () => playSpeciesCounterpoint(root))();\n};\nconst playArbitraryCounterpoint = (root = 415, voices = 4, voice = 0) => {\n    const now = _Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].currentTime;\n    const playback = Object(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"sequencer\"])(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"]);\n    const bpm = 90;\n    const pitches = Object(_Intervals__WEBPACK_IMPORTED_MODULE_1__[\"scale\"])('major');\n    const quality = Object(_Intervals__WEBPACK_IMPORTED_MODULE_1__[\"chord\"])('major');\n    const steps = 64;\n    const oo = (voice == voices - 1)\n        ? () => playArbitraryCounterpoint(randNum(333, 666), voices + 1, 0)\n        : () => { };\n    const v = playback(_Playback__WEBPACK_IMPORTED_MODULE_2__[\"audioCtx\"].createOscillator(), bpm * pow(2, voice));\n    const notes = walk(root * pow(2, voice - 2), pitches);\n    const n = notes(steps * pow(2, voice - 2), quality(root * pow(2, voice - 2)));\n    const play = v(now, n, oo);\n    play();\n    if (voice !== voices) {\n        playArbitraryCounterpoint(root, voices, voice + 1);\n    }\n};\ndocument.addEventListener('DOMContentLoaded', e => {\n    const btn = document.createElement('button');\n    btn.innerText = 'Improvise an Organ Chorale';\n    btn.addEventListener('click', e => playSpeciesCounterpoint());\n    document.body.appendChild(btn);\n    const arb = document.createElement('button');\n    arb.innerText = 'Play aribitrary counterpoint';\n    arb.addEventListener('click', e => playArbitraryCounterpoint());\n    document.body.appendChild(arb);\n});\n\n\n//# sourceURL=webpack:///./src/Composition.ts?");

/***/ }),

/***/ "./src/Intervals.ts":
/*!**************************!*\
  !*** ./src/Intervals.ts ***!
  \**************************/
/*! exports provided: Intervals, scale, relation, chord */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Intervals\", function() { return Intervals; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"scale\", function() { return scale; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"relation\", function() { return relation; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"chord\", function() { return chord; });\n/* harmony import */ var _Pitches__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Pitches */ \"./src/Pitches.ts\");\n\nvar Intervals;\n(function (Intervals) {\n    Intervals[Intervals[\"Unison\"] = 0] = \"Unison\";\n    Intervals[Intervals[\"MinorSecond\"] = 1] = \"MinorSecond\";\n    Intervals[Intervals[\"MajorSecond\"] = 2] = \"MajorSecond\";\n    Intervals[Intervals[\"MinorThird\"] = 3] = \"MinorThird\";\n    Intervals[Intervals[\"MajorThird\"] = 4] = \"MajorThird\";\n    Intervals[Intervals[\"PerfectFourth\"] = 5] = \"PerfectFourth\";\n    Intervals[Intervals[\"Tritone\"] = 6] = \"Tritone\";\n    Intervals[Intervals[\"PerfectFifth\"] = 7] = \"PerfectFifth\";\n    Intervals[Intervals[\"MinorSixth\"] = 8] = \"MinorSixth\";\n    Intervals[Intervals[\"MajorSixth\"] = 9] = \"MajorSixth\";\n    Intervals[Intervals[\"MinorSeventh\"] = 10] = \"MinorSeventh\";\n    Intervals[Intervals[\"MajorSeventh\"] = 11] = \"MajorSeventh\";\n})(Intervals || (Intervals = {}));\nlet qualities = () => ({ major: createMajorChord,\n    minor: createMinorChord,\n    augmented: createAugmentedChord,\n    diminished: createDiminishedChord,\n    dominant: createDominantChord });\nlet quality = (q) => qualities()[q] || createMajorChord;\nlet scale = (mode) => {\n    switch (mode) {\n        case 'minor':\n        case 'aeolian':\n            return ([Intervals.Unison,\n                Intervals.MajorSecond,\n                Intervals.MinorThird,\n                Intervals.PerfectFourth,\n                Intervals.PerfectFifth,\n                Intervals.MinorSixth,\n                Intervals.MinorSeventh\n            ]);\n        case 'melodicMinor':\n            return ([Intervals.Unison,\n                Intervals.MajorSecond,\n                Intervals.MinorThird,\n                Intervals.PerfectFourth,\n                Intervals.PerfectFifth,\n                Intervals.MajorSixth,\n                Intervals.MajorSeventh\n            ]);\n        case 'harmonicMinor':\n            return ([Intervals.Unison,\n                Intervals.MajorSecond,\n                Intervals.MinorThird,\n                Intervals.PerfectFourth,\n                Intervals.PerfectFifth,\n                Intervals.MinorSixth,\n                Intervals.MajorSeventh\n            ]);\n        case 'ionian':\n        default:\n            return ([Intervals.Unison,\n                Intervals.MajorSecond,\n                Intervals.MajorThird,\n                Intervals.PerfectFourth,\n                Intervals.PerfectFifth,\n                Intervals.MajorSixth,\n                Intervals.MajorSeventh\n            ]);\n    }\n};\nlet relation = (mode) => {\n    let { major, minor, augmented, diminished, dominant } = qualities();\n    switch (mode) {\n        case 'aeolian':\n        case 'minor':\n            return ({ tonic: minor,\n                supertonic: diminished,\n                mediant: major,\n                subdominant: minor,\n                dominant: major,\n                submediant: major,\n                leading: diminished\n            });\n        case 'ionian':\n        case 'major':\n        default:\n            return ({ tonic: major,\n                supertonic: minor,\n                mediant: minor,\n                subdominant: major,\n                dominant: dominant,\n                submediant: minor,\n                leading: diminished });\n    }\n};\nlet chord = (q) => (freq) => quality(q)(freq);\nlet createMajorChord = (freq) => [freq,\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 4),\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 7)];\nlet createMinorChord = (freq) => [freq,\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 3),\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 7)];\nlet createAugmentedChord = (freq) => [freq,\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 4),\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 8)];\nlet createDiminishedChord = (freq) => [freq,\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 3),\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 6)];\nlet createDominantChord = (freq) => [freq,\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 4),\n    Object(_Pitches__WEBPACK_IMPORTED_MODULE_0__[\"transpose\"])(freq, 10)];\n\n\n//# sourceURL=webpack:///./src/Intervals.ts?");

/***/ }),

/***/ "./src/Pitches.ts":
/*!************************!*\
  !*** ./src/Pitches.ts ***!
  \************************/
/*! exports provided: PitchClass, transpose, pitch, pitchclassToNote */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"PitchClass\", function() { return PitchClass; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"transpose\", function() { return transpose; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"pitch\", function() { return pitch; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"pitchclassToNote\", function() { return pitchclassToNote; });\n/* harmony import */ var _pitch_frequencies__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./pitch-frequencies */ \"./src/pitch-frequencies.ts\");\n\n// valus betweeon 0 and 1\nvar PitchClass;\n(function (PitchClass) {\n    PitchClass[PitchClass[\"C\"] = 0] = \"C\";\n    PitchClass[PitchClass[\"Cs\"] = 1] = \"Cs\";\n    PitchClass[PitchClass[\"D\"] = 2] = \"D\";\n    PitchClass[PitchClass[\"Ds\"] = 3] = \"Ds\";\n    PitchClass[PitchClass[\"E\"] = 4] = \"E\";\n    PitchClass[PitchClass[\"F\"] = 5] = \"F\";\n    PitchClass[PitchClass[\"Fs\"] = 6] = \"Fs\";\n    PitchClass[PitchClass[\"G\"] = 7] = \"G\";\n    PitchClass[PitchClass[\"Gs\"] = 8] = \"Gs\";\n    PitchClass[PitchClass[\"A\"] = 9] = \"A\";\n    PitchClass[PitchClass[\"As\"] = 10] = \"As\";\n    PitchClass[PitchClass[\"B\"] = 11] = \"B\";\n})(PitchClass || (PitchClass = {}));\nlet translatePitch = (pitch) => {\n    switch (pitch) {\n        case `Cs`:\n        case `C#`:\n        case `C sharp`:\n        case `C Sharp`:\n            return PitchClass.Cs;\n        case `D`:\n            return PitchClass.D;\n        case `Ds`:\n        case `D#`:\n        case `D sharp`:\n        case `D Sharp`:\n            return PitchClass.Ds;\n        case `E`:\n            return PitchClass.E;\n        case `F`:\n            return PitchClass.F;\n        case `Fs`:\n        case `F#`:\n        case `F sharp`:\n        case `F Sharp`:\n            return PitchClass.Fs;\n        case `G`:\n            return PitchClass.G;\n        case `Gs`:\n        case `G#`:\n        case `G sharp`:\n        case `G Sharp`:\n            return PitchClass.Gs;\n        case `A`:\n            return PitchClass.A;\n        case `As`:\n        case `A#`:\n        case `A sharp`:\n        case `A Sharp`:\n            return PitchClass.As;\n        case `B`:\n            return PitchClass.B;\n    }\n};\nlet transpositionMap = (rising = true) => [1, (16 / 15), (9 / 8), (6 / 5), (5 / 4), (4 / 3), rising ? (45 / 32) : (25 / 18)];\nlet transpose = (freq, steps) => {\n    // Use `NaN` to represent a rest\n    // if ( isNaN(freq)) \n    //   return 0\n    let modTable = transpositionMap();\n    let bound = modTable.length - 1;\n    if (steps <= bound) {\n        return freq * modTable[steps];\n    }\n    steps = steps - bound;\n    return transpose(transpose(freq, bound), steps);\n};\nlet pitch = (name, octave = 4) => (_pitch_frequencies__WEBPACK_IMPORTED_MODULE_0__[\"frequencies\"][`${name}${octave.toString()}`] || 0);\nlet pitchclassToNote = (p) => {\n    if (typeof p == 'string')\n        return p;\n    let note = PitchClass[p];\n    return note;\n};\n\n\n//# sourceURL=webpack:///./src/Pitches.ts?");

/***/ }),

/***/ "./src/Playback.ts":
/*!*************************!*\
  !*** ./src/Playback.ts ***!
  \*************************/
/*! exports provided: audioCtx, sequencer, playPart, playMovements */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"audioCtx\", function() { return audioCtx; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"sequencer\", function() { return sequencer; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"playPart\", function() { return playPart; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"playMovements\", function() { return playMovements; });\nconst audioCtx = new (window.AudioContext)();\nlet setup = (osc, duration, length = 0.8) => (freq, when, offset = 0) => {\n    const width = duration * length;\n    const cutoff = duration * length;\n    osc.frequency.setValueAtTime(freq, when + (duration * offset));\n    osc.frequency.setValueAtTime(0, when + (duration * offset) + cutoff);\n};\nlet sequencer = (ctx) => (osc, bpm = 128) => (when, notes, onended = () => { }) => {\n    osc.connect(ctx.destination);\n    return function startMusic() {\n        const now = ctx.currentTime;\n        const duration = 60 / bpm;\n        const playAt = setup(osc, duration);\n        for (let i in notes)\n            playAt(notes[i], now, parseInt(i));\n        osc.start();\n        osc.stop(now + (duration * notes.length));\n        osc.onended = onended;\n    };\n};\nlet playPart = (ctx) => (part, bpm, next = () => { }) => sequencer(ctx)(ctx.createOscillator(), bpm)(ctx.currentTime, part, next)();\nlet playMovements = (ctx) => (sections, bpm) => {\n    if (sections.length == 0)\n        return;\n    const section = sections.shift();\n    section.forEach((part, i) => {\n        const oo = (i == part.length - 1)\n            ? () => playMovements(ctx)(sections, bpm)\n            : () => { };\n        playPart(ctx)(part, bpm, oo);\n    });\n};\n\n\n//# sourceURL=webpack:///./src/Playback.ts?");

/***/ }),

/***/ "./src/pitch-frequencies.ts":
/*!**********************************!*\
  !*** ./src/pitch-frequencies.ts ***!
  \**********************************/
/*! exports provided: frequencies */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"frequencies\", function() { return frequencies; });\nconst frequencies = { C0: 16.2,\n    Db0: 17.17,\n    D0: 18.19,\n    Eb0: 19.27,\n    E0: 20.41,\n    F0: 21.63,\n    Gb0: 22.91,\n    G0: 24.28,\n    Ab0: 25.72,\n    A0: 27.25,\n    Bb0: 28.87,\n    B0: 30.59,\n    C1: 32.41,\n    Db1: 34.33,\n    D1: 36.37,\n    Eb1: 38.54,\n    E1: 40.83,\n    F1: 43.26,\n    Gb1: 45.83,\n    G1: 48.55,\n    Ab1: 51.44,\n    A1: 54.5,\n    Bb1: 57.74,\n    B1: 61.17,\n    C2: 64.81,\n    Db2: 68.67,\n    D2: 72.75,\n    Eb2: 77.07,\n    E2: 81.66,\n    F2: 86.51,\n    Gb2: 91.66,\n    G2: 97.11,\n    Ab2: 102.88,\n    A2: 109,\n    Bb2: 115.48,\n    B2: 122.35,\n    C3: 129.62,\n    Db3: 137.33,\n    D3: 145.5,\n    Eb3: 154.15,\n    E3: 163.32,\n    F3: 173.03,\n    Gb3: 183.32,\n    G3: 194.22,\n    Ab3: 205.76,\n    A3: 218,\n    Bb3: 230.96,\n    B3: 244.7,\n    C4: 259.25,\n    Db4: 274.66,\n    D4: 290.99,\n    Eb4: 308.3,\n    E4: 326.63,\n    F4: 346.05,\n    Gb4: 366.63,\n    G4: 388.43,\n    Ab4: 411.53,\n    A4: 436,\n    Bb4: 461.93,\n    B4: 489.39,\n    C5: 518.49,\n    Db5: 549.33,\n    D5: 581.99,\n    Eb5: 616.6,\n    E5: 653.26,\n    F5: 692.11,\n    Gb5: 733.26,\n    G5: 776.86,\n    Ab5: 823.06,\n    A5: 872,\n    Bb5: 923.85,\n    B5: 978.79,\n    C6: 1036.99,\n    Db6: 1098.65,\n    D6: 1163.98,\n    Eb6: 1233.19,\n    E6: 1306.52,\n    F6: 1384.21,\n    Gb6: 1466.52,\n    G6: 1553.73,\n    Ab6: 1646.12,\n    A6: 1744,\n    Bb6: 1847.7,\n    B6: 1957.57,\n    C7: 2073.98,\n    Db7: 2197.3,\n    D7: 2327.96,\n    Eb7: 2466.39,\n    E7: 2613.05,\n    F7: 2768.43,\n    Gb7: 2933.05,\n    G7: 3107.45,\n    Ab7: 3292.23,\n    A7: 3488,\n    Bb7: 3695.41,\n    B7: 3915.15,\n    C8: 4147.95,\n    Db8: 4394.6,\n    D8: 4655.92,\n    Eb8: 4932.78,\n    E8: 5226.09,\n    F8: 5536.85,\n    Gb8: 5866.09,\n    G8: 6214.91,\n    Ab8: 6584.47,\n    A8: 6976,\n    Bb8: 7390.81,\n    B8: 7830.3 };\n\n\n//# sourceURL=webpack:///./src/pitch-frequencies.ts?");

/***/ })

/******/ });