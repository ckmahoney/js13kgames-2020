import { transpose } from './music'


export const ac = new AudioContext()


type Note = [number, number] | number[][]


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
  eq.forEach(function( config, filter ) {
    filter = this[ config[ 0 ] ] = this.ac.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = config[ 1 ];
    prev.connect( prev = filter );
  }.bind( this ));
  prev.connect( this.ac.destination );
  return this;
};


// recreate the oscillator node (happens on every play)
Sequence.prototype.createOscillator = function() {
  this.stop();
  this.osc = this.ac.createOscillator();
  this.osc.type = this.waveType || 'square';
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

  console.log(`play: this.next:${typeof this.next}`)
  this.createOscillator();
  this.osc.start( when );

  this.notes.forEach(function( note, i ) {
    when = this.scheduleNote( i, when );
  }.bind( this ));

  this.osc.stop( when );
  if ( typeof this.next != 'undefined') {
    console.log(`enqueuing next seq`)
    this.osc.onended = this.play.bind( this.next, when )
  }

  return this;
};


// stop playback, null out the oscillator, cancel parameter automation
Sequence.prototype.stop = function() {
  if ( this.osc ) {
    this.osc.onended = null;
    this.osc.stop( 0 );
    this.osc.frequency.cancelScheduledValues( 0 );
    this.osc = null;
  }
  return this;
};


// const lead = (freq, duration = 1, notes = [4, 9, 9, 7, 4, 9, 10, 10, 11 ]): Note[] =>
//   notes.map((interval,i) => [transpose(freq, interval), duration])

// const harmony = (freq, duration = 1, notes = [0, 7, 5, 11, 7, 4, 7, 9]): Note[] =>
//   notes.map((interval,i) => [transpose(freq, interval), duration])

// const bass = (freq, duration = 1, notes = [12, 0, 10, 12, 0, 0, 7, 5]): Note[] =>
//   notes.map((interval,i) => [transpose(freq, interval), duration])


export const intervalsToMelody = (root, duration = (i) => 1, intervals: number[] = []): Note[] => 
  intervals.map((interval, i) => 
    ([isNaN(interval) ? 0 : transpose(root, interval), duration(i)]))

 
export const partLead = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);
  seq.staccato = 0.55;
  seq.gain.gain.value = 1.0;
  seq.mid.frequency.value = 800;
  seq.mid.gain.value = 3;
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
  return function play() {
    seq.play(when)
    return seq
  }
  // seq.play( when + ( 60 / tempo ) * 16 );
}


export const partBass = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);

  seq.staccato = 0.05;
  seq.smoothing = 0.4;
  seq.gain.gain.value = 0.65;
  seq.mid.gain.value = 3;
   
  seq.bass.gain.value = 6;
  seq.bass.frequency.value = 80;
  seq.mid.gain.value = -6;
  seq.mid.frequency.value = 500;
  seq.treble.gain.value = -2;
  seq.treble.frequency.value = 1400;
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
    (location <= (i+1) * beatDuration))
}


export function getBeatLength(bpm) {
  return (60/bpm)*1000
}


 // export const demoMusic = (tempo = 132) => {
 //  const when = ac.currentTime
 //  playLead(when, tempo, lead(512))
 //  playHarmony(when, tempo, harmony(1024))
 //  playBass(when, tempo, bass(128))
 // }
