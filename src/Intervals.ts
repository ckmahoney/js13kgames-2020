import { Freq, transpose } from './Pitches'



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


export enum Quality 
  { Minor = 'minor'
  , Major = 'major'
  , Augmented = 'augmented'
  , Diminished = 'diminished'
  , Dominant = 'dominant'
  , Quartal = 'quartal'
  }


type ChordMap =
  { [quality: string]: ChordFactory }


export interface ChordFactory
  { (freq: Freq): Chord }


interface ChordByFreq 
  { (quality: string): (freq: Freq) => Chord }


export type Chord = [ Freq, Freq, Freq ]


const qualities = (): ChordMap => 
  ({[Quality.Major]: createMajorChord
  , [Quality.Minor]: createMinorChord
  , [Quality.Augmented]: createAugmentedChord
  , [Quality.Diminished]: createDiminishedChord
  , [Quality.Dominant]: createDominantChord })


const quality = (q): ChordFactory =>
  qualities()[q] || createMajorChord


export const scale = ( mode ) => {
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


export const relation = (mode: string): ChordMap => {
  const {major, minor, augmented, diminished, dominant} = qualities()
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


export const chord: ChordByFreq = (q) => (freq): Chord => 
  quality(q)(freq)


const createMajorChord: ChordFactory = (freq): Chord =>
  [ freq
  , transpose(freq, 4)
  , transpose(freq, 7) ]


const createMinorChord: ChordFactory = (freq): Chord  =>
  [ freq
  , transpose(freq, 3)
  , transpose(freq, 7) ]


const createAugmentedChord: ChordFactory = (freq): Chord  =>
  [ freq
  , transpose(freq, 4)
  , transpose(freq, 8) ]


const createDiminishedChord: ChordFactory = (freq): Chord  =>
  [ freq
  , transpose(freq, 3)
  , transpose(freq, 6) ]


const createDominantChord: ChordFactory = (freq): Chord  => 
  [ freq
  , transpose(freq, 4)
  , transpose(freq, 10)]

