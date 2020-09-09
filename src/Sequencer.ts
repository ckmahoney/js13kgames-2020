import { transpose } from './music'


export const ac = new AudioContext()
const delay = ac.createDelay(4)
delay.delayTime.value = (60/120/4) //quarter note at 120bpm

// const source = ac.createBufferSource();
// source.buffer = buffers[2];
// source.loop = true;
// source.start();
// source.connect(delay);
delay.connect(ac.destination);



export type Note = [number, number] | number[][]


export type Synth = typeof partBass | typeof partHarmony | typeof partLead


function Note( freq, duration ) {
  return [freq, duration];
}


export function Sequence( tempo, notes: Note[] = []) {
  this.ac = ac;
  this.createFxNodes();
  this.tempo = tempo || 120;
  this.loop = true;
  this.smoothing = 0;
  this.staccato = 0;
  this.notes = notes;
}

// create gain and EQ nodes, then connect 'em
Sequence.prototype.createFxNodes = function() {
  const eq = [ [ 'bass', 100 ], [ 'mid', 1000 ] , [ 'treble', 2500 ] ]
  let prev = this.gain = this.ac.createGain();
  eq.forEach(function( config, fx) {
    fx = this[ config[ 0 ] ] = this.ac.createBiquadFilter();
    fx.type = 'peaking';
    fx.frequency.value = config[ 1 ];
    prev.connect( prev = fx );
  }.bind( this ));

  this.lp = this.ac.createBiquadFilter()
  this.lp.type = 'lowpass'
  this.lp.frequency.value = 15000
  prev.connect(prev = this.lp)

  this.hp = this.ac.createBiquadFilter()
  this.hp.type = 'highpass'
  this.hp.frequency.value = 80
  prev.connect(prev = this.hp)

  prev.connect( this.ac.destination );
  return this;
};


// recreate the oscillator node (happens on every play)
Sequence.prototype.createOscillator = function() {
  this.stop();
  this.osc = this.ac.createOscillator();
  this.osc.type = this.waveType || 'square';
  this.gain.value = 0.1
  if (this.type == 'lead') {
    this.osc.connect(delay);
    this.osc.connect(this.ac.destination);
    this.osc.connect(this.ac.destination);
  }
  this.osc.connect( this.gain );
  return this;
};


// schedules this.notes[ index ] to play at the given time
// returns an AudioContext timestamp of when the note will *end*
Sequence.prototype.scheduleNote = function( index, when ) {
  const duration = 60 / this.tempo * this.notes[ index ][1],
    cutoff = duration * ( 1 - ( this.staccato || 0 ) );

  this.setFrequency( this.notes[ index ][0], when );

  if ( this.smoothing && this.notes[ index ][0] ) {
    this.slide( index, when, cutoff );
  }

  this.setFrequency( 0, when + cutoff );
  return when + duration;
};


// get the next note
Sequence.prototype.getNextNote = function( index ) {
  return this.notes[ index < this.notes.length - 1 ? index + 1 : 0 ];
};


// how long do we wait before beginning the slide? (in seconds)
Sequence.prototype.getSlideStartDelay = function( duration ) {
  return duration - Math.min( duration, 60 / this.tempo * this.smoothing );
};


// slide the note at <index> into the next note at the given time,
// and apply staccato effect if needed
Sequence.prototype.slide = function( index, when, cutoff ) {
  const next = this.getNextNote( index ),
    start = this.getSlideStartDelay( cutoff );
  this.setFrequency( this.notes[ index ][0], when + start );
  this.rampFrequency( next[0], when + cutoff );
  return this;
};


Sequence.prototype.setFrequency = function( freq, when ) {
  this.osc.frequency.setValueAtTime( freq, when );
  return this;
};

Sequence.prototype.rampFrequency = function( freq, when ) {
  this.osc.frequency.linearRampToValueAtTime( freq, when );
  return this;
};


// run through all notes in the sequence and schedule them
Sequence.prototype.play = function( when ) {
  when = typeof when === 'number' ? when : this.ac.currentTime;

  this.createOscillator();
  this.osc.start( when+1 );

  this.notes.forEach(function( note, i ) {
    when = this.scheduleNote( i, when );
  }.bind( this ));

  this.osc.stop( when );
  return this;
};


// stop playback, null out the oscillator, cancel parameter automation
Sequence.prototype.stop = function() {
  if ( this.osc ) {
    this.osc.stop( 0 );
    this.osc.frequency.cancelScheduledValues( 0 );
    this.osc = null;
  }
  return this;
};


export const intervalsToMelody = (root, duration = (i) => 1, intervals: number[] = []): Note[] => 
  intervals.map((interval, i) => 
    ([isNaN(interval) ? 0 : transpose(root, interval), duration(i)]))

 
export const partLead = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);
  seq.staccato = 0.55;
  seq.gain.gain.value = 1.0;
  seq.bass.frequency.value = 400;
  seq.bass.gain.value = -4
  seq.mid.frequency.value = 800;
  seq.mid.gain.value = 3;
  seq.waveType = 'square'
  seq.hp.frequency.value = 1200
  seq.role = 'lead'

  return function play() {
    seq.play(when)
    return seq
  }
}


export const partHarmony = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);
  seq.mid.frequency.value = 1200;
  seq.gain.gain.value = 0.8;
  seq.staccato = 0.55;
  seq.waveType = 'triangle'
  return function play() {
    seq.play(when)
    return seq
  }
}


export const partBass = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);

  seq.staccato = 0.05;
  seq.smoothing = 0.05;
  seq.gain.gain.value = 0.65;
  seq.mid.gain.value = 3;
   
  seq.bass.gain.value = 6;
  seq.bass.frequency.value = 80;
  seq.mid.gain.value = -2;
  seq.mid.frequency.value = 500;
  seq.treble.gain.value = -4;
  seq.treble.frequency.value = 1400;
  seq.waveType = 'square'

  return function play() {
    seq.play(when)
    return seq
  }
}


export function getBeatIndex(time: number, bpm, notes = []) {
  const beatDuration = getBeatLength(bpm)
  const barDuration = beatDuration * notes.length
  const location = time % barDuration

  return notes.findIndex((note, i) => 
    location <= ((i+1) * beatDuration))
}


export function getBeatLength(bpm) {
  return (60/bpm)
}


export function getStartOfNextBar(time, bpm, notes) {
  let currentIndex = getBeatIndex(time, bpm, notes)
  const beatWidth = getBeatLength(bpm)

}