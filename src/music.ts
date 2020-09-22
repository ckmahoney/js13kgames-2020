import { Time, Seconds } from './Time'
import { Freq, PitchClass } from './Pitches'


enum Waves
  { sine
  , square
  , sawtooth
  , triangle }


interface GetNumber 
  { (...nums: number[]): number }


type PlaybackControls =
  { bpm: number
    duration: number
    repeats: number 
  }


let print = (...any) => console.log(any)


let osc = (ctx, opts = {}) => {
  let oscillator = ctx.createOscillator();
  let gain = ctx.createGain();
  gain.connect(ctx.destination)
  oscillator.connect(gain);
  oscillator.type = 'square';
  gain.volume = 0.1
  oscillator.gain = gain
  for (let o in opts)
    oscillator[o] = opts[o]
  return oscillator
}


let createTime = (bpm,opts={},n=4,d=4,_=0): Time => {
  let beat: Seconds = 60/(bpm)
  let bar: Seconds = n * beat
  let ratio: GetNumber = (a=n, b=d) => a/b 

  const time =
    { bpm
    , beat
    , bar
    , ratio
    , moment: _
    , numerator: n
    , denominator: d
    }

  return {...time, ...opts}
}


// export let setup = () => {
//   // @ts-ignore
//   let ctx = new (window.AudioContext || window.webkitAudioContext)();
//   let start: Seconds = Date.now()
  
//   return (event) => play({ ctx, start })
// }