import { PitchClass, Freq, Note, Range } from './Pitches'
import { Seconds } from './Time'
import { scale } from './Intervals'


export const audioCtx = new (window.AudioContext)()


let setup = (osc: OscillatorNode, duration: Range, length = 0.8) => (freq, when: Seconds, offset = 0) => {
	const width = duration * length
	const cutoff = duration * length
  osc.frequency.setValueAtTime(freq, when + (duration * offset))
  osc.frequency.setValueAtTime(0, when + (duration * offset) + cutoff)
}

export let sequencer = (ctx) => (osc: OscillatorNode, bpm = 128) => (when, notes: Note[], onended = () => {}) =>  {
	osc.connect(ctx.destination)

	return function startMusic() {
		const now = ctx.currentTime
		const duration = 60/bpm
		const playAt = setup(osc, duration)

		for (let i in notes) 
	    playAt(notes[i], now, parseInt(i))

		osc.start()
    console.log('has duration: ' + duration);
		console.log('stopping at ', 1 + now + (duration * notes.length))
		osc.stop(1 + now + (notes.length))
		osc.onended = onended
	}
}