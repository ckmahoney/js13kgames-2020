import { transpose, pitch, Note, Freq, PitchClass, toPitchClass } from './Pitches';
import { scale, relation, chord, Chord, ChordFactory, Intervals } from './Intervals';
import { sequencer, Melody, audioCtx } from './Playback'
import { keyMenu } from './GUI'
import { muse } from './muse'
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


let randNum = (min = 0, max = 1) => 
  random() * (max - min) + min


let randInt = (min = 0, max = 1) => 
  floor(random() * (floor(max) - ceil(min) + 1) + ceil(min))



const part = (scale: Intervals[], steps = 16, notes = []): Note[] => 
  (notes.length == steps)
    ? notes
    : part(scale, steps, [...notes, randFrom(scale)])



let order = (num, order, base = 2) => 
  num * pow(base, order)


const defaultConfig = 
  { steps: 16
  , voices: 4
  , speed: 108/4
  , quality: 'major'
  }


type SectionSettings = typeof defaultConfig


function noop() {
  console.log('')
  // do nothing stop it typescript
}


const isFinalVoice = (index, numParts) =>
  numParts == index + 1


const toKey = (key) => (interval) =>
  transpose(pitch(key,4), interval)



const modulate = (notes: Note[], key: PitchClass) => {
  return notes.map((note, i) => {
    return transpose //(note, i)
  })
}


const _createMelody = (tonic = PitchClass.As) => {
  const subdominant = (tonic + 5) % 11
  const dominant = (tonic + 7) % 11

  const melodyA = modulate(part(scale('major'), 8, []), toPitchClass((tonic)))
  const melodyB = modulate(part(scale('minor'), 8, []), toPitchClass((subdominant)))
  const melodyC = modulate(part(scale('major'), 8, []), toPitchClass((dominant)))

  return [...melodyA, ...melodyA, ...melodyB, ...melodyC]
}


const createMelody = () => {
  const melodyA = part(scale('minor'), 2, []).map(toKey(`Bb`))
  const melodyB = part(scale('major'), 1, []).map(toKey(`D`))
  const melodyC = part(scale('major'), 1, []).map(toKey(`F`))
  return [...melodyA, ...melodyA, ...melodyB, ...melodyC]
}


const loopAABA = (melodies = [[]], settings = defaultConfig) => {
  playComposition(settings, melodies, () => loopAABA(melodies, settings))
}


const playComposition = (settings: SectionSettings, parts, onended = noop ) => {
  const {steps, voices, speed, quality} = settings
  const playCtx = new window.AudioContext()
  const recordCtx = new window.AudioContext()
  // @ts-ignore
  const mixer = recordCtx.createMediaStreamDestination()
  // @ts-ignore
  const recorder = new window.MediaRecorder(mixer.stream)
  // const samples = audioCtx.createBuffer(parts.length, audioCtx.sampleRate * 9, audioCtx.sampleRate)
  const samples = []

  recorder.ondataavailable = function(evt) {
    // @ts-ignore
    const title = document.querySelector("input[name=title]")?.value || 'Algo Music'
    // @ts-ignore
    console.log(`data avalable:`, window.event=evt)
    samples.push(evt.data)
    let anchor = document.createElement('a')
    let url = URL.createObjectURL(new Blob(samples))
    anchor.href = url
    anchor.download = `${title}.wav`
    anchor.innerText = "Download Track"
    document.querySelector("audio").src = url
    document.body.appendChild(anchor)
    anchor.onclick = anchor.remove
    // anchor.click()
    // anchor.remove()
   }

  recorder.addEventListener('stop', (e) => {
    // Make blob out of our blobs, and open it.
    let blob = new Blob(samples, { 'type' : 'audio/ogg; codecs=opus' });
    const url = URL.createObjectURL(blob)
    console.log(`url is `, url);
  })


  const playback = sequencer(audioCtx)
  const recording = sequencer(audioCtx, recorder)

  const stop = document.createElement(`button`)
  stop.onclick = () => audioCtx.close()
  
  parts.reduce((now, notes, i, list) => {
    const voice = playback(audioCtx.createOscillator(), speed)
    const mimic = recording(audioCtx.createOscillator(), speed)
    const play = voice(now, notes, isFinalVoice(i, list.length) ? onended : noop)
    const record = mimic(now, notes, () => console.log(`finished recording for voice ${i}`))
    play()
    record()
    return now + speed * list.length;
  }, audioCtx.currentTime)
}


export const playSpeciesCounterpoint = (root = 415, config = defaultConfig) => {
  const { voices, steps, quality, speed } = config
  const now = audioCtx.currentTime
  const playback = sequencer(audioCtx)
  const pitches = scale(quality)
  const constructor = chord(quality)

  // for Species Counterpoint
  // use four independent lines each with different step lengths
  const bass = playback(audioCtx.createOscillator(), speed)
  const tenor = playback(audioCtx.createOscillator(), speed*2)
  const alto = playback(audioCtx.createOscillator(), speed*4)
  const soprano = playback(audioCtx.createOscillator(), speed*8)

  bass(now, walk(root/4, pitches)(order(steps,-2), constructor(root/4)))()
  tenor(now, walk(root/2, pitches)(order(steps, -1), constructor(root/2)))()
  alto(now, walk(root, pitches)(order(steps, 0), constructor(root)))()
  // only one of the parts needs to trigger the callback
  soprano(now, walk(root*2, pitches)(order(steps, 1), constructor(root*2)), () => playSpeciesCounterpoint(root) )()
}


export const playArbitraryCounterpoint =  (root = 415, voices = 4, voice = 0) => {
  const now = audioCtx.currentTime
  const playback = sequencer(audioCtx)
  const speed = 90
  const pitches = scale('major')
  const quality = chord('major')
  const steps = 64

  const oo = (voice == voices - 1)
    ? () => playArbitraryCounterpoint(randNum(333, 666), voices + 1, 0)
    : () => {}
  const v = playback(audioCtx.createOscillator(), speed * pow(2,voice))
  const notes = walk(root * pow(2, voice-2), pitches)
  const n = notes(steps * pow(2, voice-2), quality(root * pow(2, voice-2)))
  const play = v(now, n, oo)
  play()
  
  if (voice !== voices) {
    playArbitraryCounterpoint(root, voices, voice + 1)
  }
}


document.addEventListener('DOMContentLoaded', e => {
  let button = (name, cb) => {
    const b = document.createElement('button')
    b.innerText = name
    b.addEventListener('click', cb)
    document.body.appendChild(b)
  }

  // const btn = document.createElement('button')
  // btn.innerText = 'Improvise an Organ Chorale'
  // btn.addEventListener('click', e => playSpeciesCounterpoint())
  // document.body.appendChild(btn)

  // const arb = document.createElement('button')
  // arb.innerText = 'Play aribitrary counterpoint'
  // arb.addEventListener('click', e => playArbitraryCounterpoint())
  // document.body.appendChild(arb)

  // const menu = keyMenu()
  // document.body.appendChild(menu.element)

  button('Record improvised composition', _ =>loopAABA([createMelody()], {...defaultConfig, speed: 128}))
  button('muse', muse)

})

