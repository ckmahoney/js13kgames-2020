  import { transpose } from './music'
  /*
   * Private stuffz
   */
 
  var enharmonics = 'B#-C|C#-Db|D|D#-Eb|E-Fb|E#-F|F#-Gb|G|G#-Ab|A|A#-Bb|B-Cb',
    middleC = 440 * Math.pow( Math.pow( 2, 1 / 12 ), -9 ),
    octaveOffset = 4,
    offsets = {};
 
  // populate the offset lookup (note distance from C, in semitones)
  enharmonics.split('|').forEach(function( val, i ) {
    val.split('-').forEach(function( note ) {
      offsets[ note ] = i;
    });
  });
 
  /*
   * Note class
   */
 
  // new Note ('A4 q') === 440Hz, quarter note
  // new Note ('- e') === 0Hz (basically a rest), eigth note
  // new Note ('A4 es') === 440Hz, dotted eighth note (eighth + sixteenth)
  // new Note ('A4 0.0125') === 440Hz, 32nd note (or any arbitrary 
  // divisor/multiple of 1 beat)
  function Note( freq, duration ) {
    return [freq, duration];
    // duration, as a ratio of 1 beat (quarter note = 1, half note = 0.5, etc.)
    this.duration = duration
  }
 
  
 const ac = new AudioContext()
 
  /*
   * Sequence class
   */
 
 export function Sequence( tempo, notes: [number, number][] = []) {
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
    var eq = [ [ 'bass', 100 ], [ 'mid', 1000 ] , [ 'treble', 2500 ] ],
      prev = this.gain = this.ac.createGain();
    eq.forEach(function( config, filter ) {
      filter = this[ config[ 0 ] ] = this.ac.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = config[ 1 ];
      prev.connect( prev = filter );
    }.bind( this ));
    prev.connect( this.ac.destination );
    return this;
  };
 
  // accepts Note instances or strings (e.g. 'A4 e')
  Sequence.prototype.push = function() {
    Array.prototype.forEach.call( arguments, function( point ) {
      console.log('pushing freq, duration', point[0], point[1])
      this.notes.push(point);
    }.bind( this ));
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
    var duration = 60 / this.tempo * this.notes[ index ][1],
      cutoff = duration * ( 1 - ( this.staccato || 0 ) );

    console.log(`looking for ntoe ${index}`)
    console.log(this.notes[index])
 
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
    var next = this.getNextNote( index ),
      start = this.getSlideStartDelay( cutoff );
    this.setFrequency( this.notes[ index ][0], when + start );
    this.rampFrequency( next[0], when + cutoff );
    return this;
  };
 
  // set frequency at time
  Sequence.prototype.setFrequency = function( freq, when ) {
    this.osc.frequency.setValueAtTime( freq, when );
    return this;
  };
 
  // ramp to frequency at time
  Sequence.prototype.rampFrequency = function( freq, when ) {
    this.osc.frequency.linearRampToValueAtTime( freq, when );
    return this;
  };
 
  // run through all notes in the sequence and schedule them
  Sequence.prototype.play = function( when ) {
    console.log(`playing with notes`, this.notes)
    when = typeof when === 'number' ? when : this.ac.currentTime;
 
    this.createOscillator();
    this.osc.start( when );
 
    this.notes.forEach(function( note, i ) {
      when = this.scheduleNote( i, when );
    }.bind( this ));
 
    this.osc.stop( when );
    this.osc.onended = this.loop ? this.play.bind( this, when ) : null;
 
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

 
const when = ac.currentTime,
  tempo = 132;

  let 
  sequence1,
  sequence2,
  sequence3;


  const lead = (freq) => {
    return (
    [11, 10, 9, 8, 7, 7, 5, 2 ])
    .map((interval,duration) => [transpose(freq, interval), 1])
  }


  const harmony = (freq) => {
    return ([7, 7, 5, 11, 7, 4, 7, 9])
    .map((interval,duration) => [transpose(freq, interval), 1])
  }

  const bass = (freq) => {
    return ([0, 0, 7, 5, 0, 0, 5, 7])
    .map((interval,duration) => [transpose(freq, interval), 1])
  }


 export const playMusic = () => {
console.log(`playing`)
  sequence1 = new Sequence( tempo, <[number,number][]>lead(512) );
  sequence2 = new Sequence( tempo, <[number,number][]>harmony(1024) );
  sequence3 = new Sequence( tempo, <[number,number][]>bass(64) );
   
  sequence1.staccato = 0.55;
  sequence2.staccato = 0.55;
  sequence3.staccato = 0.05;
  sequence3.smoothing = 0.4;
   
  sequence1.gain.gain.value = 1.0;
  sequence2.gain.gain.value = 0.8;
  sequence3.gain.gain.value = 0.65;
   
  sequence1.mid.frequency.value = 800;
  sequence1.mid.gain.value = 3;
   
  sequence2.mid.frequency.value = 1200;
  sequence3.mid.gain.value = 3;
   
  sequence3.bass.gain.value = 6;
  sequence3.bass.frequency.value = 80;
  sequence3.mid.gain.value = -6;
  sequence3.mid.frequency.value = 500;
  sequence3.treble.gain.value = -2;
  sequence3.treble.frequency.value = 1400;
   
  sequence1.play( when );
  // delay by 16 beats
  sequence2.play( when + ( 60 / tempo ) * 16 );
  sequence3.play( when );
  return
 }
