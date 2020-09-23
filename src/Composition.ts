import { pitchclassToNote, transpose, pitch, Note, Freq, PitchClass } from './Pitches';
import { scale, relation, chord, Chord, ChordFactory, Intervals } from './Intervals';
import { audioCtx, sequencer } from './Playback'
const { round, random, pow, floor, ceil } = Math
enum Relationships
  { Tonic
  , Supertonic
  , Mediant
  , Subdominant
  , Dominant 
  , Submediant
  , Leading }

type Role =
  { name: string
    note: string  
    pitchclass: PitchClass
    freq: Freq
    constructor: ChordFactory
    get: (octave?:number) => Chord
  }

type Roles = 
  { [relationship: string]: Role
  }

type Relationship = 
  { [name: string]: PitchClass
  }

let selectHarmonicRelatives = (tonic: PitchClass, relatives: string[]): Relationship => {
  let r = 
    { supertonic: Intervals.MajorSecond
    , mediant: Intervals.MajorThird
    , subdominant: Intervals.PerfectFourth
    , dominant: Intervals.PerfectFifth
    , submediant: Intervals.MajorSixth
    , leading: Intervals.MajorSeventh }

  let keys = Object.keys(r)

  return relatives.reduce((selections, relative) => 
    ({...selections, [relative]: (tonic + r[relative])}), {tonic})
}


export let randFrom = <T>(arr: any[]): T | void => {
  if (arr.length < 1) 
    return

  let index = round(random() * (arr.length - 1))
  return arr[index]
}


export let walk = (root: PitchClass, scale) => (beats: number, weights: number[], acc = []): Note[] => {
  if (acc.length == beats) 
    return acc

  const passingTones = scale.filter(n => ! weights.includes(n))

  // use a strong tone on strong beats; other tones on weak beats
  const selection  = ( acc.length % 2 == 1 )
    ? <Intervals>randFrom(scale)
    : <Intervals>randFrom(passingTones)

  return walk(root, scale)(beats, weights, [...acc, transpose(root, selection)])
}


export let walkingLine = (root: string, mode = 'ionian', amt = 8 ): Freq[] => {
  const weights = [0, 3, 4] // tonic points of a Western scale
  const pitches = scale(mode)
  const notes = []
  for (let i = 0; i < amt; i++) {
    let selection
    if ( i % 2 == 0 ) {
      // use a weighted tone on strong beats
      let index = round(random() * weights.length)
      selection = weights[index]
    } else {
      let index = round(random() * pitches.length)
      selection = pitches[index]
    }
    notes[i] = selection
  }
  
  return notes
}

export let createParts = (root: PitchClass, relationships=['subdominant', 'dominant'], mode='major'): Roles => {
  let chordMap = relation(mode)
  let relatives = selectHarmonicRelatives(PitchClass[PitchClass[root]], relationships)
  let parts: Roles = {}
  // @ts-ignore
  Object.entries(relatives).forEach(([role, pitchclass]) => {
    parts[role] =
      { name: role
      , note: pitchclassToNote(pitchclass)
      , pitchclass: relatives[role]
      , freq: transpose(pitch(root),relatives[role])
      , constructor: chordMap[role]
      , get: function chord(octave=1)
        { return this.constructor(parts[role].freq/4*(octave/1)) }
      }
  })

  return parts
} 

export let createGenericProgression = (root=PitchClass.C): Chord[][] => {
  let parts = createParts(root)
  let fill = (chord: Chord) => 
    Array(4).fill(chord)

  let tonic = parts.tonic.get(1)
  let subdominant = parts.subdominant.get(1)
  let dominant = parts.dominant.get(1)
  return (
    [ fill(tonic)
    , fill(subdominant)
    , fill(dominant)
    , [subdominant, dominant, subdominant, dominant] ] )
}


let randNum = (min = 0, max = 1) => 
  random() * (max - min) + min


let randInt = (min = 0, max = 1) => 
  floor(random() * (floor(max) - ceil(min) + 1) + ceil(min))


// export const section = (root, quality, steps = 64, voices = 4, parts = []) => {
//   if (parts.length == voices) 
//     return parts
 
//   const melody = part(root, quality)
//   return [...parts, melody(pitches, steps, parts.length)]
// }


export const part = (root, quality: ChordFactory) => (pitches: Intervals[], steps, voice = 3) => {
  const notes = walk(root * pow(2, voice), pitches)
  const melody = notes(steps * pow(2, voice), quality(root * pow(2, voice)))
  return melody
}


// export const playSonataForm = () => {
//   const now = audioCtx.currentTime
//   const playback = sequencer(audioCtx)
//   const bpm = 90
//   const pitches = scale('major')
//   const quality = chord('major')
//   const steps = 13

//   const exposition = createGenericProgression('Bb')
//   const development = createGenericProgression('F')
//   const recapitulation = createGenericProgression('D')
// }


let magnitude = (num, order, base = 2) => 
  num * pow(base, order)


export const playSpeciesCounterpoint = (root = 415) => {
  const now = audioCtx.currentTime
  const playback = sequencer(audioCtx)
  const bpm = 108/4
  const pitches = scale('major')
  const quality = chord('major')
  const steps = 16
  const voices = 4

  // for Species Counterpoint
  // use four independent lines each with different step lengths
  const bass = playback(audioCtx.createOscillator(), bpm)
  const tenor = playback(audioCtx.createOscillator(), bpm*2)
  const alto = playback(audioCtx.createOscillator(), bpm*4)
  const soprano = playback(audioCtx.createOscillator(), bpm*8)

  bass(now, walk(root/4, pitches)(magnitude(steps,-2), quality(root/4)))()
  tenor(now, walk(root/2, pitches)(magnitude(steps, -1), quality(root/2)))()
  alto(now, walk(root, pitches)(magnitude(steps, 0), quality(root)))()
  // only one of the parts needs to trigger the callback
  soprano(now, walk(root*2, pitches)(magnitude(steps, 1), quality(root*2)), () => playSpeciesCounterpoint(root) )()
}


export const playArbitraryCounterpoint = (root = 415, voices = 4, voice = 0) => {
  const now = audioCtx.currentTime
  const playback = sequencer(audioCtx)
  const bpm = 90
  const pitches = scale('major')
  const quality = chord('major')
  const steps = 64

  const oo = (voice == voices - 1) 
    ? () => playArbitraryCounterpoint(randNum(333, 666), voices + 1, 0)
    : () => {}
  const v = playback(audioCtx.createOscillator(), bpm * pow(2,voice))
  const notes = walk(root * pow(2, voice-2), pitches)
  const n = notes(steps * pow(2, voice-2), quality(root * pow(2, voice-2)))
  console.log('using notes',n)
  const play = v(now, n, oo)
  play()
  
  if (voice !== voices) {
    playArbitraryCounterpoint(root, voices, voice + 1)
  }
}


document.addEventListener('DOMContentLoaded', e => {
  const btn = document.createElement('button')
  btn.innerText = 'Improvise an Organ Chorale'
  btn.addEventListener('click', e => playSpeciesCounterpoint())
  document.body.appendChild(btn)

  const arb = document.createElement('button')
  arb.innerText = 'Play aribitrary counterpoint'
  arb.addEventListener('click', e => playArbitraryCounterpoint())
  document.body.appendChild(arb)

})