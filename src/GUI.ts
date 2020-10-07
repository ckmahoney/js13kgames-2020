import { PitchClass } from './Pitches'


export const keyMenu = () => {
  const input = document.createElement('select')
  const opts = 
    { [PitchClass['B']]: 'B'
    , [PitchClass['C']]: 'C'
    , [PitchClass['Cs']]: 'C#'
    , [PitchClass['D']]: 'D'
    , [PitchClass['Ds']]: 'D#'
    , [PitchClass['E']]: 'E'
    , [PitchClass['F']]: 'F'
    , [PitchClass['Fs']]: 'F#'
    , [PitchClass['G']]: 'G'
    , [PitchClass['Gs']]: 'G#'
    , [PitchClass['A']]: 'A'
    , [PitchClass['As']]: 'A#' 
    }

  Object.entries(opts).forEach(([value, name]) => {
    const option = document.createElement('option')
    option.innerText = name
    option.value = value
    input.appendChild(option)
  })
 
  return { element: input
    , get: () => input.value
    }
}