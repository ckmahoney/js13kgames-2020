import { PitchClass, Freq, Note, Range } from './Pitches'
import { Seconds } from './Time'
import { scale } from './Intervals'

export type Melody = Freq[] & Note[]

export const audioCtx = new (window.AudioContext)()


let setup = (osc: OscillatorNode, duration: Range, length = 0.8) => (freq, when: Seconds, offset = 0) => {
	const width = duration * length
	const cutoff = duration * length
	console.log(`has freq:`,freq)
  osc.frequency.setValueAtTime(freq, when + (duration * offset))
  osc.frequency.setValueAtTime(0, when + (duration * offset) + cutoff)
}


export let sequencer = (ctx) => (osc: OscillatorNode, bpm = 128) => (when, freqs: Note[], onended = () => {}) =>  {
  const dest = ctx.createMediaStreamDestination()
  console.log(`created dest:`, dest)
  //@ts-ignore
  const recorder = new window.MediaRecorder(dest.stream);
  const chunks = [];

	osc.connect(dest)


  recorder.ondataavailable = function(evt) {
     // push each chunk (blobs) in an array
     chunks.push(evt.data);
   };

   recorder.onstop = function(evt) {
     // Make blob out of our blobs, and open it.
     let blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
     let audioTag = document.createElement('audio');
     const url = URL.createObjectURL(blob)
     console.log(`url is `, url);
     document.querySelector("audio").src = url;
   };

   recorder.addEventListener('stop', (e) => {
   	let anchor = document.createElement('a')
   	anchor.href = URL.createObjectURL(new Blob(chunks))
   	anchor.download = "Algo Music.wav"
   	document.body.appendChild(anchor)
   	anchor.click()
   	anchor.remove()
   })

	return function play() {
		const now = ctx.currentTime
		const duration = 60/bpm
    console.log(`has duration`, duration)
		const playAt = setup(osc, duration)

		for (let i in freqs) 
	    playAt(freqs[i], now, parseInt(i))
    
		recorder.start();
		osc.start(0)
		osc.stop(now + (duration * freqs.length))
		osc.onended = () => {
			console.log(`ended the oscillator`)
			let data = recorder.requestData();
	    console.log(`got this data from the recorder:`, data);
	    recorder.stop()
			// onended();
		}
	}
}


export let playPart = (ctx: AudioContext) => (part: Melody, bpm, next = () => {}) => 
  sequencer(ctx)(ctx.createOscillator(), bpm)(ctx.currentTime, part, next)()


export let playMovements = (ctx: AudioContext) => (sections: Melody[][], bpm) => {
	if (sections.length == 0) 
	  return

	const section = sections.shift()
	section.forEach((part, i) => {
    const oo = (i == part.length - 1)
      ? () => playMovements(ctx)( sections, bpm )
      : () => {}
   	playPart(ctx)(part, bpm, oo)
	})
}


