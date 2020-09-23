import { pitchclassToNote, transpose, nameToFreq, Freq, PitchClass } from './Pitches';
import { scale, relation, chord, Chord, ChordFactory, Intervals } from './Intervals';
import { audioCtx, sequencer } from './Playback'

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

  let index = Math.round(Math.random() * (arr.length - 1))
  return arr[index]
}


export let walk = (root: PitchClass, scale: Intervals[]) => (beats: number, weights: number[], acc = []) => {
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
      let index = Math.round(Math.random() * weights.length)
      selection = weights[index]
    } else {
      let index = Math.round(Math.random() * pitches.length)
      selection = pitches[index]
    }
    notes[i] = selection
  }
  
  return notes
}

export let createParts = (root: string, relationships=['subdominant', 'dominant'], mode='major'): Roles => {
  let chordMap = relation(mode)
  let relatives = selectHarmonicRelatives(PitchClass[root], relationships)
  let parts: Roles = {}
  // @ts-ignore
  Object.entries(relatives).forEach(([role, pitchclass]) => {
    parts[role] =
      { name: role
      , note: pitchclassToNote(pitchclass)
      , pitchclass: relatives[role]
      , freq: transpose(nameToFreq(root),relatives[role])
      , constructor: chordMap[role]
      , get: function chord(octave=1)
        { return this.constructor(parts[role].freq/4*(octave/1)) }
      }
  })

  return parts
} 

export let createGenericProgression = (root=`C`): Chord[][] => {
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


export const loop = () => {
  console.log('playing at ' ,+new Date)
}


export const playSpeciesCounterpoint = (root = 415) => {
  console.log(`using root: ${root}`)
  const now = audioCtx.currentTime
  const playback = sequencer(audioCtx)
  const bpm = 128/4
  const melody = walk(root, scale('major'))
  const quality = chord('major')

  // for Species Counterpoint
  // use four lines each with different step lengths and playback rates
  const bass = playback(audioCtx.createOscillator(), bpm)
  const tenor = playback(audioCtx.createOscillator(), bpm*2)
  const alto = playback(audioCtx.createOscillator(), bpm*4)
  const soprano = playback(audioCtx.createOscillator(), bpm*8)

  bass(now, walk(root/4, scale('major'))(16, quality(root/4)))()
  tenor(now, walk(root/2, scale('major'))(32, quality(root/2)))()
  alto(now, walk(root, scale('major'))(64, quality(root)))()
  // only one of the parts needs to trigger the callback
  soprano(now, walk(root*2, scale('major'))(128, quality(root*2)), () => playSpeciesCounterpoint(root) )()
}


export const play = () => {
  const osc = audioCtx.createOscillator()
  const sequence = sequencer(audioCtx)(osc)
  const major = chord('major')
  const root = 315
  const melody = walk(root, scale('minor'))
  const notes = melody(4, chord('minor')(root), []);
  const start = sequence(audioCtx.currentTime, notes, play)
  start()
}

document.addEventListener('DOMContentLoaded', e => {
  const btn = document.createElement('button')
  btn.innerText = 'click to play'
  btn.addEventListener('click', e => playSpeciesCounterpoint())
  document.body.appendChild(btn)
})