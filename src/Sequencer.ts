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


export var ac = new AudioContext()


export type Note = [number, number] | number[][]


export type Synth = typeof partKick | typeof partHat | typeof partLead


function Note( freq, duration ) {
  return [freq, duration];
}


export function S( tempo, notes: Note[] = []) {
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
S.prototype.createFxNodes = function() {
  let prev = this.gain = this.ac.createGain();

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


// recreate the.oillator node (happens on every play)
S.prototype.createOscillator = function() {
  this.stop();
    
  if (this.role == 'hat') {
    var bufferSize = 2 * ac.sampleRate,
        buff = ac.createBuffer(1, bufferSize, ac.sampleRate),
        output = buff.getChannelData(0);

    for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    this.o = ac.createBufferSource();
    this.o.buffer = buff;
    this.o.loop = true;
    this.gain.value = 0.1;

  } else {
    this.o = this.ac.createOscillator();
    this.o.type = this.shape
    this.gain.value = 0.2;
  }


  if (this.role == 'kick') {
    var dis = this.ac.createWaveShaper();
    dis.curve = disCurve(400);
    dis.oversample = '4x';
    this.o.connect(dis)
    dis.connect(ac.destination)
    return this;
  }


  this.o.connect( this.gain );
  this.o.connect(ac.destination);

  return this;
};


// schedules this.notes[ index ] to play at the given time
// returns an AudioContext timestamp of t the note will *end*
S.prototype.scheduleNote = function( index, t ) {
  var duration = 60 / this.tempo * this.notes[ index ][1],
    cutoff = duration * ( 1 - ( this.staccato || 0 ) );

  

  this.setFrequency( this.notes[ index ][0], t );
  
  if ( this.smoothing && this.notes[ index ][0] ) {
    this.slide( index, t, cutoff );
  }

  if (this.role == 'kick') {
    this.o.frequency.exponentialRampToValueAtTime(1, t + cutoff)
  } else {
    this.setFrequency( 0, t + cutoff );
  }
  return t + duration;
};


// get the next note
S.prototype.getNextNote = function( index ) {
  return this.notes[ index < this.notes.length - 1 ? index + 1 : 0 ];
};


// how long do we wait before beginning the slide? (in seconds)
S.prototype.getSlideStartDelay = function( width ) {
  return width - Math.min( width, 60 / this.tempo * this.smoothing );
};


// slide the note at <index> into the next note at the given time,
// and apply staccato effect if needed
S.prototype.slide = function( index, t, cutoff ) {
  var next = this.getNextNote( index ),
    start = this.getSlideStartDelay( cutoff );
  this.setFrequency( this.notes[ index ][0], t + start );
  this.rampFrequency( next[0], t + cutoff );
  return this;
};

S.prototype.setFrequency = function( freq, t ) {
  if (this.o instanceof OscillatorNode) {
    this.o.frequency.setValueAtTime( freq, t );
  }

  return this;
};

S.prototype.rampFrequency = function( freq, t ) {
  this.o.frequency.linearRampToValueAtTime( freq, t );
  return this;
};


// run through all notes in the sequence and schedule them
S.prototype.play = function( t ) {
  t = (typeof t === 'number') ? t : this.ac.currentTime;

  this.createOscillator();
  this.o.start( t+1 );
  this.notes.forEach(function( note, i ) {
    t = this.scheduleNote( i, t );
  }.bind( this ));

  this.o.stop( t );
  return this;
};


// stop playback, null out the.oillator, cancel parameter automation
S.prototype.stop = function() {
  if (this.o instanceof OscillatorNode) {
    this.o.stop( 0 );
    this.o.frequency.cancelScheduledValues( 0 );
    this.o = null;
  }
  return this;
};


export var intervalsToMelody = (root, duration = (i) => 1, intervals: number[] = []): Note[] => 
  intervals.map((interval, i) => 
    ([isNaN(interval) ? 0 : transpose(root, interval), duration(i)]))

 
export var partLead = (t, tempo, melody: Note[]) => {
  var seq = new S(tempo, melody);
  seq.staccato = 0.55;
  seq.gain.gain.value = 1.0;
  seq.type = 'square'
  seq.hp.frequency.value = 1200
  seq.role = 'lead'

  return function play() {
    seq.play(t)
    return seq
  }
}


export var partHat = (t, tempo, melody: Note[]) => {
  var seq = new S(tempo, melody);
  seq.staccato = 0.55;
  seq.gain.gain.value = -20.0;
  seq.shape = 'square'
  seq.role = 'hat'
  seq.hp.frequency.value = 19000
  seq.lp.frequency.value = 22000


  return function play() {
    seq.play(t)
    return seq
  }
}


export var partKick = (t, tempo, melody: Note[]) => {
  var seq = new S(tempo, melody);

  seq.gain.gain.value = 0.65;
  seq.gain.gain.value = 0.1;
   
  seq.role = 'kick'
  seq.shape = 'sine'

  seq.lp.frequency.value = 120
  seq.hp.frequency.value = 32


  return function play() {
    seq.play(t)
    return seq
  }
}


export function getBeatIndex(time: number, bpm, notes = []) {
  var width = getBeatLength(bpm)
  var height = width * notes.length
  var z = time % height

  return notes.findIndex((note, i) => 
    z <= ((i+1) * width))
}


export var getBeatLength =bpm =>
  (60/bpm)


export function getStartOfNextBar(time, bpm, notes) {
  let currentIndex = getBeatIndex(time, bpm, notes)
  var beatWidth = getBeatLength(bpm)

}

function disCurve(amt = 50) {
  var n = 44100,
    c = new Float32Array(n),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n; ++i ) {
    x = i * 2 / n - 1;
    c[i] = ( 3 + amt ) * x * 20 * deg / ( Math.PI + amt * Math.abs(x) );
  }


  return c;
};

