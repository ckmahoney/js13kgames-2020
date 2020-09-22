import { transpose } from './Pitches'


type Osc =
  OscillatorNode
  & { next: OscillatorNode | null
    // , setupNextBeat: any
    , notes: number[]
    , freq: number
  }

const audioCtx = new (window.AudioContext)()
const audioOut = audioCtx.createGain()

const melodies = {
  bass: [0, 0, 7, 5, 0, 0, 5, 7],
  tenor: [7, 7, 5, 11, 7, 4, 7, 9],
  alto: [4, 4, 0, 2, 4, 4, 7, 5],
  soprano: [11, 10, 9, 8, 7, 7, 5, 2 ]
}

const bpm = 105
const beats = melodies.bass.length
const beatDuration = (60/bpm)*1000


const createOscillator = (opts = {}, ctx = audioCtx): Osc => {
  let osc = <Osc>ctx.createOscillator()
  for (let o in opts) {
     osc[o] = opts[o]
  }
  osc.connect(ctx.destination)
  return osc
}



const setupNextBeat = (time, opts, duration) => {
  console.log(`setting up `)
  // const barDuration = beatDuration * notes.length
  const osc = createOscillator(opts)
  let location = time + duration
  osc.frequency.setValueAtTime(opts.freq, location)
  // create a break in sound between notes for clarity
  osc.frequency.setValueAtTime(0, location + (duration * 0.5))
  osc.start()
  osc.stop(time + beatDuration)
  // setTimeout(() => delete osc, 1 + time + beatDuration)
  console.log('should stop at', time + duration)
  return osc
}


const getBeatIndex = (time: number, notes: number[], beatDuration) => {
  const barDuration = beatDuration * notes.length
  const location = time % barDuration

  return notes.findIndex((note, i) => 
    location <= (i+1) * beatDuration)
}


const loop = (time: number, parts: any[], ctx, tonic = 64) => {
  Object.values(parts).forEach((sequence, i, parts) => {
    const currentBeat = getBeatIndex(time, sequence, beatDuration)
    sequence.forEach((interval, beatIndex) => {
      let freq = transpose(tonic * Math.pow(2, i), interval)
      setupNextBeat(time, {freq, type: 'square'}, beatDuration)
    })
  })

  requestAnimationFrame((nt) => loop(nt, parts, ctx, tonic))
}


function play(parts) {
  loop(0, parts, audioCtx, 64)
}


export default  function soundtrack() {
  play(melodies)
}