import { Freq} from './Pitches'


interface Next 
  { (n: number, list: any[], mod: any, count?: number): any }


let next: Next = (limit=1, list:Freq[]=[], mod, n=0): any => {
  if (list.length == limit)
    return list

  let prev: Freq = list[list.length-1]
  let newx: Freq = mod(n, prev, list[0])
  return next(limit, list.concat(newx), mod, n+1)
}

let octaveSeries = (startFreq=32, qty=10): Freq[] | Next => 
  next(qty, [startFreq], (n, prev, first)=> prev*2)


let getHarmonicSeries = (startFreq=32, qty=10): Freq[] => 
  next(qty, [], (n, prev, first)=> (n==0?startFreq:(prev*(1+n))/n))


let selectHarmonicPoints = (frequencies, n=0) => 
  frequencies.reduce((selections, freq, index) => {
    let amtToSkip = selections.length
    if (n == amtToSkip) {
      n = 0
      return selections.concat(freq)
    }
    n++
    return selections
  }, [])



let harmonicProgression = (fundamental=32) => {
  let fundamentals = getHarmonicSeries(fundamental)
  return fundamentals
}