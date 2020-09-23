export type Time 
  = TimeSignature
  & TimeRate


export type Seconds = number;
// export type Milliseconds = number;
// export type Duration = Milliseconds;


export type TimeSignature =
  { numerator: number
    denominator: number
    ratio: (...args) =>number
    bpm?: number
  }


export type TimeRate =
  { bpm: number
    beat: Seconds
    bar: Seconds
  }