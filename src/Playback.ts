import { PitchClass, Freq, Note, Range } from './Pitches'
import { Seconds } from './Time'
import { scale } from './Intervals'

export type Melody = Freq[] & Note[]

export const audioCtx = new (window.AudioContext)()

let setup = (osc: OscillatorNode, duration: Range, length = 0.8) => (freq, when: Seconds, offset = 0) => {
	const width = duration * length
	const cutoff = duration * length
  osc.frequency.setValueAtTime(freq, when + (duration * offset))
  osc.frequency.setValueAtTime(0, when + (duration * offset) + cutoff)
}

export let sequencer = (ctx, recorder = null) => (osc: OscillatorNode, bpm = 128) => (when, freqs: Note[], onended = () => {}) =>  {
  console.log(`has recorder:`,recorder)
  console.log(`using ctx:`, ctx);
  osc.connect(ctx.destination)


	return function play() {
		const note = document.createElement('p')
		note.innerHTML = `
		<b>Recording a melody for you</b>. This should take no more than 15 seconds.
		When it is done, it will prompt you to <i>save</i> or <i>play</i> the file. <br/>
		Save it, and you can then open it in any media player supporting .wav files! (VLC recommended) <br/>
		The audio element on this page will also be loaded with the new music. <br/>
		If you set your player to loop the track, you will hear how the melody is a looper. <br/>
		<b>Press the button again for a new composition!</b>
		`

		document.body.appendChild(note)

		const now = ctx.currentTime
		const duration = 60/bpm
    console.log(`has duration`, duration)
		const playAt = setup(osc, duration)

		for (let i in freqs) 
	    playAt(freqs[i], now, parseInt(i))
    
    recorder && recorder.start();
		osc.start(0)
		osc.stop(now + (duration * freqs.length))
		osc.onended = () => {
			recorder && recorder.requestData();
	    recorder && recorder.stop()
			onended();
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


