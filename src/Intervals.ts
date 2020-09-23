import { Freq, transpose } from './Pitches'


type ChordMap =
  { [quality: string]: ChordFactory }


export interface ChordFactory
  { (freq: Freq): Chord }


interface ChordByFreq 
  { (quality: string): (freq: Freq) => Chord }


export type Chord = [ Freq, Freq, Freq ]


export enum Intervals
  { Unison
  , MinorSecond
  , MajorSecond
  , MinorThird
  , MajorThird
  , PerfectFourth
  , Tritone
  , PerfectFifth
  , MinorSixth
  , MajorSixth
  , MinorSeventh
  , MajorSeventh }


let qualities = (): ChordMap => 
  ({major: createMajorChord
  , minor: createMinorChord
  , augmented: createAugmentedChord
  , diminished: createDiminishedChord
  , dominant: createDominantChord })


let quality = (q): ChordFactory =>
  qualities()[q] || createMajorChord


export let scale = ( mode ) => {
  switch (mode) {
    case 'minor':
    case 'aeolian': 
      return (
        [ Intervals.Unison
        , Intervals.MajorSecond
        , Intervals.MinorThird
        , Intervals.PerfectFourth
        , Intervals.PerfectFifth
        , Intervals.MinorSixth
        , Intervals.MinorSeventh
       ])

    case 'melodicMinor':
      return (
        [ Intervals.Unison
        , Intervals.MajorSecond
        , Intervals.MinorThird
        , Intervals.PerfectFourth
        , Intervals.PerfectFifth
        , Intervals.MajorSixth
        , Intervals.MajorSeventh
       ])

    case 'harmonicMinor':
      return (
        [ Intervals.Unison
        , Intervals.MajorSecond
        , Intervals.MinorThird
        , Intervals.PerfectFourth
        , Intervals.PerfectFifth
        , Intervals.MinorSixth
        , Intervals.MajorSeventh
       ])

    case 'ionian':
    default: 
      return (
        [ Intervals.Unison
        , Intervals.MajorSecond
        , Intervals.MajorThird
        , Intervals.PerfectFourth
        , Intervals.PerfectFifth
        , Intervals.MajorSixth
        , Intervals.MajorSeventh
       ])
  }  
}


export let relation = (mode: string): ChordMap => {
  let {major, minor, augmented, diminished, dominant} = qualities()
  switch( mode ) {
    case 'aeolian': 
    case 'minor':
      return (
      { tonic: minor
      , supertonic: diminished
      , mediant: major
      , subdominant: minor
      , dominant: major
      , submediant: major
      , leading: diminished
      })
    case 'ionian': 
    case 'major':
    default: 
      return (
      { tonic: major
      , supertonic: minor
      , mediant: minor
      , subdominant: major
      , dominant: dominant
      , submediant: minor
      , leading: diminished })
  }
}


export let chord: ChordByFreq = (q) => (freq): Chord => 
  quality(q)(freq)


let createMajorChord: ChordFactory = (freq): Chord =>
  [ freq
  , transpose(freq, 4)
  , transpose(freq, 7) ]


let createMinorChord: ChordFactory = (freq): Chord  =>
  [ freq
  , transpose(freq, 3)
  , transpose(freq, 7) ]


let createAugmentedChord: ChordFactory = (freq): Chord  =>
  [ freq
  , transpose(freq, 4)
  , transpose(freq, 8) ]


let createDiminishedChord: ChordFactory = (freq): Chord  =>
  [ freq
  , transpose(freq, 3)
  , transpose(freq, 6) ]


let createDominantChord: ChordFactory = (freq): Chord  => 
  [ freq
  , transpose(freq, 4)
  , transpose(freq, 10)]

