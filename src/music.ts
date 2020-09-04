import { frequencies } from './pitch-frequencies.ts'


type Milliseconds = number;


type Seconds = number;


type Freq = number;


type Chord = [ Freq, Freq, Freq ]


enum PitchClass
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


enum Intervals
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


enum Relationships
  { Tonic
  , Supertonic
  , Mediant
  , Subdominant
  , Dominant 
  , Submediant
  , Leading }


enum Waves
  { sine
  , square
  , sawtooth
  , triangle }


interface ChordByFreq 
  { (freq: Freq): (...args: any[]) => Chord }


interface Modifier<T>
  { (index: number, previous: T, first: T): T }


interface Next 
  { (n: number, list: any[], mod: Modifier<any>, count?: number): any }


interface GetNumber 
  { (...nums: number[]): number }


interface ChordFactory
  { (freq: Freq): Chord }


type Time 
  = TimeSignature
  & TimeRate


type TimeSignature =
  { numerator: number
    denominator: number
    ratio: GetNumber 
    bpm?: number
  }


type TimeRate =
  { bpm: number
    beat: Seconds
    bar: Seconds
  }
  

type PlaybackControls =
  { bpm: number
    duration: number
    repeats: number 
  }


type ChordMap =
  { [quality: string]: ChordFactory }


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


let print = (...any) => console.log(any)


let next: Next = (limit=1, list:Freq[]=[], mod, n=0): any => {
  if (list.length == limit)
    return list

  let prev: Freq = list[list.length-1]
  let newx: Freq = mod(n, prev, list[0])
  return next(limit, list.concat(newx), mod, n+1)
}


let transpose = (freq, steps): Freq   => {
  let modTable = transpositionMap() 
  let bound = modTable.length - 1
  if (steps <= bound) {
    return freq * modTable[steps] 
  }

  steps = steps - bound
  return transpose(transpose(freq, bound), steps)
}


let chordByFreq: ChordByFreq = (freq) => 
  (quality='major'): Chord => 
    qualities()[quality](freq)


let octaveSeries = (startFreq=32, qty=10): Freq[] | Next => 
  next(qty, [startFreq], (n, prev, first)=> prev*2)


let getHarmonicSeries = (startFreq=32, qty=10): Freq[] => 
  next(qty, [], (n, prev, first)=> (n==0?startFreq:(prev*(1+n))/n))


let selectHarmonicPoints = (frequencies, n=0) => 
  frequencies.reduce((selections, freq, index) => {
    let amtToSkip = selections.length
    if (n == amtToSkip) {
      n = 0
      return selections.concat(freq)
    }
    n++
    return selections
  }, [])



let pitchclassToNote = (p: string | PitchClass): string => {
  if (typeof p == 'string') 
    return p

  let note = PitchClass[p] 

  // while (note > PitchClass.length)
  //   note = note - PitchClass.length

  return note
}


let pitchOctave = (pitch: PitchClass, octave = 5) =>
  `${pitch}${octave.toString()}`


let nameToFreq = (pitchclass) =>
  (frequencies[pitchOctave(pitchclass)] || 0)


// adapted from wikipedia (Interval, music theory)
let transpositionMap = (rising = true) =>
  [ 1, (16/15), (9/8), (6/5), (5/4), (4/3), rising ? (45/32) : (25/18)]


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


let harmonicProgression = (fundamental=32) => {
  let fundamentals = getHarmonicSeries(fundamental)
  return fundamentals
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
    (keys.includes(relative) ? {...selections, [relative]: (tonic + r[relative])} : selections), {tonic})
}


let qualities = (): ChordMap => 
  ({ major: createMajorChord
  , minor: createMinorChord
  , augmented: createAugmentedChord
  , diminished: createDiminishedChord
  , dominant: createDominantChord })


let getMode = (state: string): ChordMap => {
  let {major, minor, augmented, diminished, dominant} = qualities()
  switch( state) {
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


export let createParts = (root: string, relationships=['subdominant', 'dominant'], mode='major'): Roles => {
  let chordMap = getMode(mode)
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


let enqueue = (osc, freq, time) =>
  osc.frequency.setValueAtTime(freq, time);  


// let createTrigger = (osc, freq: Freq) =>
//   (trigger, f?: Freq) =>
//     osc.frequency.setValueAtTime(f || freq, trigger());  


let ar = (osc, freq, start, duration) => {
  // osc.gain.volume = 0.8
  osc.frequency.value = freq
  // setTimeout(osc.gain.volume=0),duration)
}


let playbackSequence = (list, fn, loop=false) => {
  let chain = list.reduce(fn, Promise.resolve())
  return (loop)
    ? chain.then(() => playbackSequence(list, fn, loop))
    : chain
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


let playBar = (bar, voices, time) => 
  new Promise((resolve, reject) => {
    let phraseNum = 0
    let sustain = 0.75

    function schedule(notes: Freq[], beat: number) {
      const beatStart = beat*time.beat
      let timestamp = time.moment + beatStart
 
      notes.forEach((freq: Freq, voice: number) => {
        let osc = voices[voice]
        osc.frequency.setValueAtTime(freq, timestamp)        
      })

      if (beat == (time.numerator-1)) {
        phraseNum++
      }
    }

    bar.forEach((noteStack, beat) => schedule(noteStack, beat))
    setTimeout(resolve, time.bar)
})


export let play = ({ctx,start}) => {
  let time = createTime(
    { bpm: 132
    , numerator: 4
    , denominator:4
    , start: Date.now() - start })
  let chords = createGenericProgression(`F`)
  let voices = chords.reduce((voices, bar, i) => [...voices, osc(ctx, {type: Waves[i]})], [])

  let chainPlayback = (chain, bar, index, list) => {
    return chain.then(() => 
      new Promise((resolve, reject) => {
        let now = new Date();
        //@ts-ignore
        time.moment = now - start;
        playBar(bar, voices, time)
        .then(resolve)
    }))
  }

  playbackSequence(chords, chainPlayback, true)

  voices.forEach(osc =>osc.start())
}


export let setup = () => {
  // @ts-ignore
  let ctx = new (window.AudioContext || window.webkitAudioContext)();
  let start: Seconds = Date.now()
  
  return (event) => play({ ctx, start })
}