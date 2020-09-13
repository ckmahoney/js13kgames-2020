type Freq = number;


let transpositionMap = (rising = true) =>
  [ 1, (16/15), (9/8), (6/5), (5/4), (4/3), rising ? (45/32) : (25/18)]


export let transpose = (freq: number, steps: number): Freq   => {
  // Use `NaN` to represent a rest
  if (isNaN(freq)) 
    return 1
  
  let modTable = transpositionMap() 
  let bound = modTable.length - 1
  if (steps <= bound) {
    return freq * modTable[steps] 
  }

  steps = steps - bound
  return transpose(transpose(freq, bound), steps)
}


export const ac = new AudioContext()


export type Note = [number, number] | number[][]


export type Synth = typeof partKick | typeof partHat | typeof partLead


function Note( freq, duration ) {
  return [freq, duration];
}


export function Sequence( tempo, notes: Note[] = []) {
  this.ac = ac;
  this.createFxNodes();
  this.fx = [];
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
    
  if (this.role == 'hat') {
    var bufferSize = 2 * ac.sampleRate,
        noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate),
        output = noiseBuffer.getChannelData(0);

    for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    this.osc = ac.createBufferSource();
    this.osc.buffer = noiseBuffer;
    this.osc.loop = true;

  } else {
    this.osc = this.ac.createOscillator();
    this.osc.type = this.shape
  }

  this.gain.value = 0.2;

  if (this.role == 'kick') {
    const distortion = this.ac.createWaveShaper();
    distortion.curve = distortionCurve(400);
    distortion.oversample = '4x';
    this.osc.connect(distortion)
    distortion.connect(ac.destination)
    return this;
  }


  this.osc.connect( this.gain );
  this.osc.connect(ac.destination);

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

  if (this.role == 'kick') {
    this.osc.frequency.exponentialRampToValueAtTime(1, when + cutoff)
  } else {
    this.setFrequency( 0, when + cutoff );
  }
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
  if (this.osc instanceof AudioBufferSourceNode) {
  }

  if (this.osc instanceof OscillatorNode) {
    this.osc.frequency.setValueAtTime( freq, when );
  }

  return this;
};

Sequence.prototype.rampFrequency = function( freq, when ) {
  this.osc.frequency.linearRampToValueAtTime( freq, when );
  return this;
};


// run through all notes in the sequence and schedule them
Sequence.prototype.play = function( when ) {
  when = (typeof when === 'number') ? when : this.ac.currentTime;

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
  if (this.osc) {
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
  seq.type = 'square'
  seq.hp.frequency.value = 1200
  seq.role = 'lead'

  return function play() {
    seq.play(when)
    return seq
  }
}


// export const partHarmony = (when, tempo, melody: Note[]) => {
//   const seq = new Sequence(tempo, melody);
//   seq.mid.frequency.value = 1200;
//   seq.gain.gain.value = 0.8;
//   seq.staccato = 0.55;
//   seq.type = 'triangle'
//   seq.role = 'harmony'
//   return function play() {
//     seq.play(when)
//     return seq
//   }
// }


// export const partBass = (when, tempo, melody: Note[]) => {
//   const seq = new Sequence(tempo, melody);

//   seq.staccato = 0.05;
//   seq.smoothing = 0.05;
//   seq.gain.gain.value = 0.65;
//   seq.mid.gain.value = 3;
   
//   seq.bass.gain.value = 6;
//   seq.bass.frequency.value = 80;
//   seq.mid.gain.value = -2;
//   seq.mid.frequency.value = 500;
//   seq.treble.gain.value = -4;
//   seq.treble.frequency.value = 1400;
//   seq.role = 'bass'
//   seq.type = 'square'

//   return function play() {
//     seq.play(when)
//     return seq
//   }
// }


export const partHat = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);
  seq.staccato = 0.55;
  seq.gain.gain.value = -20.0;
  seq.bass.frequency.value = 6000;
  seq.mid.frequency.value = 10000;
  seq.mid.gain.value = 3;
  seq.hp.frequency.value = 22000
  seq.shape = 'square'
  seq.role = 'hat'
  seq.hp.frequency.value = 19000
  seq.lp.frequency.value = 22000


  return function play() {
    seq.play(when)
    return seq
  }
}


export const partKick = (when, tempo, melody: Note[]) => {
  const seq = new Sequence(tempo, melody);

  seq.gain.gain.value = 0.65;
  seq.gain.gain.value = 0.1;
   
  seq.bass.gain.value = 3;
  seq.bass.frequency.value = 40;
  seq.mid.gain.value = -0;
  seq.mid.frequency.value = 300;
  seq.treble.gain.value = -4;
  seq.treble.frequency.value = 1400;
  seq.role = 'kick'
  seq.shape = 'sine'

  seq.lp.frequency.value = 120
  seq.hp.frequency.value = 32


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

function distortionCurve(amt = 50) {
  var n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + amt ) * x * 20 * deg / ( Math.PI + amt * Math.abs(x) );
  }


  return curve;
};

