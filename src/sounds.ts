import { transpose } from './music'
console.log('got a transpose function')
console.log(transpose)

const ctx = new (window.AudioContext)()
const audioOut = ctx.createGain()

const melodies = {
  bass: [0, 0, 7, 5, 0, 0, 5, 7],
  tenor: [7, 7, 5, 11, 7, 4, 7, 9],
  alto: [4, 4, 0, 2, 4, 4, 7, 5],
  soprano: [11, 10, 9, 8, 7, 7, 5, 2 ]
}

const bpm = 105
const beats = melodies.bass.length
const beatDuration = (bpm/60)*1000
const createParts = (voices, tonic = 64) => {

  return Object.values(voices).map((melody, i) => {
    const voice = tonic * Math.pow(2, i)
    const osc = ctx.createOscillator()

    // @ts-ignore
    melody.setupNextScene = (time, baseFreq, beatLength) => {
    // @ts-ignore
      melody.forEach((interval, beat) => {
        let pitch = transpose(baseFreq * voice, interval)
        let location = time + (beat * beatLength)
        osc.frequency.setValueAtTime(pitch, location)
      })
    }
  }, [])
}


const findBeatIndex = (time, notes, ctx) => {
  const barDuration = beatDuration * notes.length
  const location = time % barDuration
  return notes.findIndex((note, i) => 
    location <= (i+1) * beatDuration)
}


const loop = (time, parts, ctx, tonic = 64) => {
  parts.forEach((part) => {
    // allows mixed length melodies
    const beat = findBeatIndex(time, part, ctx)
    if (beat == part.length - 1) {
      part.setupNextScene(time, tonic, beatDuration)
    }
  })

  requestAnimationFrame(() => loop(time, parts, ctx, tonic))
}

  console.log(`typeof loop`, typeof loop)

function play(parts) {
  console.log(`typeof loop`, typeof loop)
  loop(0, parts, ctx, 64)
  parts.forEach(part => part.start())
  console.log(`started at ${+new Date}`)
}

export default () => play(createParts(melodies))


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



