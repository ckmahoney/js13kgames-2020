import { Seconds } from './Time'
import { frequencies } from './pitch-frequencies'


export type Freq = number


export type Note = [Freq, Seconds]


export type Range = number 
// valus betweeon 0 and 1


export enum PitchClass
  { C
  , Cs
  , D
  , Ds
  , E
  , F
  , Fs
  , G
  , Gs
  , A
  , As
  , B }  


let translatePitch = (pitch: string | PitchClass): PitchClass => {
  switch (pitch) {
    case `Cs`:
    case `C#`:
    case `C sharp`:
    case `C Sharp`: 
      return PitchClass.Cs
    case `D`: 
      return PitchClass.D
    case `Ds`:
    case `D#`:
    case `D sharp`:
    case `D Sharp`: 
      return PitchClass.Ds
    case `E`: 
      return PitchClass.E
    case `F`: 
      return PitchClass.F
    case `Fs`:
    case `F#`:
    case `F sharp`:
    case `F Sharp`: 
      return PitchClass.Fs
    case `G`: 
      return PitchClass.G
    case `Gs`:
    case `G#`:
    case `G sharp`:
    case `G Sharp`: 
      return PitchClass.Gs
    case `A`: 
      return PitchClass.A
    case `As`:
    case `A#`:
    case `A sharp`:
    case `A Sharp`: 
      return PitchClass.As
    case `B`: 
      return PitchClass.B 
  }
}


let transpositionMap = (rising = true) =>
  [ 1, (16/15), (9/8), (6/5), (5/4), (4/3), rising ? (45/32) : (25/18)]


let pitchOctave = (pitch: PitchClass, octave = 5) =>
  `${pitch}${octave.toString()}`



export let transpose = (freq: number, steps: number): Freq   => {
  // Use `NaN` to represent a rest
  // if ( isNaN(freq)) 
  //   return 0
  
  let modTable = transpositionMap() 
  let bound = modTable.length - 1
  if (steps <= bound) {
    return freq * modTable[steps] 
  }

  steps = steps - bound
  return transpose(transpose(freq, bound), steps)
}


export let nameToFreq = (pitchclass) =>
  (frequencies[pitchOctave(pitchclass)] || 0)



export let pitchclassToNote = (p: string | PitchClass): string => {
  if (typeof p == 'string') 
    return p

  let note = PitchClass[p] 


  return note
}