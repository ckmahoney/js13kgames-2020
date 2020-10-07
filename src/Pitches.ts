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


export const toPitchClass = (pitch: string | PitchClass): PitchClass => {
  switch (pitch) {
    case 0:
    case `C` :
      return PitchClass.C
    case 1:
    case `Cs`:
    case `C#`:
    case `C sharp`:
    case `C Sharp`: 
    case `D♭`:
      return PitchClass.Cs
    case 2:
    case `D`: 
      return PitchClass.D
    case 3:
    case `Ds`:
    case `D#`:
    case `D sharp`:
    case `D Sharp`: 
    case `E♭`:
      return PitchClass.Ds
    case 4:
    case `E`: 
      return PitchClass.E
    case 5:
    case `F`: 
      return PitchClass.F
    case 6:
    case `Fs`:
    case `F#`:
    case `F sharp`:
    case `F Sharp`: 
    case `G♭` :
      return PitchClass.Fs
    case 7:
    case `G`: 
      return PitchClass.G
    case 8:
    case `Gs`:
    case `G#`:
    case `G sharp`:
    case `G Sharp`: 
    case `A♭`:
      return PitchClass.Gs
    case 9:
    case `A`: 
      return PitchClass.A
    case 10:
    case `As`:
    case `A#`:
    case `A sharp`:
    case `A Sharp`: 
    case `B♭`:
      return PitchClass.As
    case 11:
    case `B`: 
      return PitchClass.B 
  }
}





let transpositionMap = (rising = true) =>
  [ 1, (16/15), (9/8), (6/5), (5/4), (4/3), rising ? (45/32) : (25/18)]


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


export let pitch = (name: string, octave = 4) =>
  (frequencies[`${name}${octave.toString()}`] || 0)


export let frq = (p: PitchClass, octave = 4) => {
  const name = PitchClass[PitchClass[p]]
  return pitch(name, octave)
}