import { frequencies } from './pitch-frequencies.mjs'


let print = any => console.log(any)


let transpose = (freq, step) => {
  let map = transpositionMap()
  return freq * map[step%map.length]
}


let upByMinorThird = (f) =>
  transpose(f,3)


let upByMajorThird = (f) =>
  transpose(f,4)


let upByFifth = (f) =>
  transpose(transpose(f, 6), 1)


let getOctaveFrequencies = (startFreq=32, qty=10) => 
  next(qty, [startFreq], _=>2)


let getHarmonicSeries = (startFreq=32, qty=10) => {
  let get = modList(n=>((n+1)/n), startFreq)
  return get(qty)
}


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


let pitchOctave = (pitchclass, octave = 5) =>
  `${pitchclass}${octave.toString()}`


let pitchToFreq = (pitchclass) =>
  (frequencies[pitchOctave(pitchclass)] || 0)


let createMajorChords = (freqList) =>
  [ freqList
  , freqList.map(upByMajorThird)
  , freqList.map(upByFifth) ]


// adapted from wikipedia (Interval, music theory)
let transpositionMap = (rising = true) =>
  [ 1, (16/15), (9/8), (6/5), (5/4), (4/3), rising ? (45/32) : (25/18)]


let createMajorChord = (freq) =>
  [ freq
  , upByMajorThird(freq)
  , upByFifth(freq) ]


let next = (n = 1, list = [], mod = (n) => 1.5) => {
  if ( n == 0)
    return list

  list = list.concat(mod(n) * list[list.length-1])
  return next(n-1, list)
}


let modList = (mod, init = 1.1) => 
  (num=1, list=[]) => next(num, list, mod, init)


let harmonicProgression = (fundamental=32) => {
  let fundamentals = getHarmonicSeries(fundamental,10)
  print("Got these super fly fundamentals")
  return fundamentals
}


let genericProgression = () => {
  let op = (pitchclass) => createMajorChord(pitchToFreq(pitchclass))
  let tonic = op('A')
  let subdominant = op('D')
  let dominant = op('E')
  
  return (
    [ Array(4).fill(tonic)
    , Array(4).fill(subdominant)
    , Array(4).fill(dominant)
    , [subdominant, dominant, subdominant, dominant] ] )
}


let createDuration = (bpm, signature, beats) => 
  


print("I made a dead ass basic progression for you")
print(genericProgression())
print("and a different one too")
print(harmonicProgression())