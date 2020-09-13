import {Quadtree} from './store'
import {Sequence, Synth, partLead, partHarmony, partKick, partBass, partHat, intervalsToMelody, ac as audioContext, getBeatLength, getBeatIndex} from './Sequencer'
const { abs, sin, cos, pow, sqrt, floor, ceil, random, PI, max, min } = Math


enum Role 
  { kick
  , tenor
  , alto
  , hat
  }


enum Clan
  { Blue
  , Red 
  , Yellow
  }


type Clansmen = 
  { clan: Clan
  , role: Role
  }


type Stats = 
  { volume: number
  , speed: number
  , luck: number
  }


type Room = 
  { clan: Clan
  , role: Role
  }


type Shot = 
  ID 
  & Location
  & RadialDimensions
  & { start: number
    , duration: number }


type State = 
  { player: Player
  , drones: Drone[]
  , drops: any[]
  , shots: Shot[]
  , pickups: Shot[]
  , room: Room
  , level: number
  , ensemble: Ensemble
  }



type ID = 
  { objectID: number
  , name: string}


type UnitPosition = Bounds & 
  { objectID: number
    name: string
  }


type ModulationMap =
  { [key: string]: GetNumber }


type Controls = string[]


type Empty = null | undefined


type SideFX = void


type Player = 
  UnitPosition 
  & Stats 
  & { name: string }


type Drone = 
  UnitPosition
  & { lastwalk?: boolean }


type Voice = 
  { bpm?: number
  , tonic?: number
  , melody?: number[] // intervals
  , notes?: number[][] // [freq, duration] point in soundspace
  , sequencer?: any
  , next?: any
  }


type SoundSource = (Voice & { clan: Clan, volume?: number, next?: typeof Sequence }) | null


type HeterogenousEnsemble =
  { bpm: number
  , tonic: number
  , voices: { [role: string]: number[]
  }}


type Ensemble = 
  { [Role.kick]: SoundSource
  , [Role.tenor]: SoundSource
  , [Role.alto]: SoundSource
  , [Role.hat]: SoundSource
  }


type RGB =
  [number,number,number] | number[]


type Location = 
  { x: number
  , y: number
  , time?: number 
  }


type Dimensions = 
  { width: number
  , height: number
  , dx?: Function
  , dy?: Function
  }


type RadialDimensions = 
  { radius?: number 
  , dr?: Function 
  }

type Bounds =
  Location
  & Dimensions


interface ControlListener
    { (key: string): Controls }


interface Game
 { (): SideFX
  controls: Controls }


interface CreateRoom
  { (clan: Clan, role: Role): Room }


interface HandleTick
  { (time: DOMHighResTimeStamp, state: State, draw: Illustrate, store: any): SideFX }


interface Render
  { (state: State): Empty }


interface Illustrate 
  { (d: Draw) : SideFX }


interface Setup
  { (state: State, tick: HandleTick, config: any): SideFX }


interface UpdateStage
  { (time: DOMTimeStamp, state: State, draw: Illustrate): SideFX }


interface Draw
  { (ctx: CanvasRenderingContext2D): SideFX }


interface StatefulDraw
  { (time: DOMHighResTimeStamp, state: State): Draw
    color?: string
    font?: string
    text?: string }


interface IsNearWall
  { (u): boolean }


interface GetNumber
  { (x: number, ...yz: number[]): number }


interface Modulate<T>
  { (prev: T, changes: ModulationMap ): T }


interface UpdateListeners
    { (time: number, state: State)
      prev?: (e: KeyboardEvent) => SideFX }


interface QTInterface
  { box: any[]
  , nodes: QTInterface[]
  , insert: (bounds) => void
  , split: () => void
  , getIndex: (bounds) => void
  , clear: () => void
  , retrieve: (bounds) => any
  }


// # Game Data 


const clanAttributes = 
  { [Clan.Red]: 
    { rgb: [255,0,0]
    }
  , [Clan.Blue]: 
    { rgb: [0,0,255]
    }
  , [Clan.Yellow]:
    { rgb: [0,255,0]
    }
  }


const roleAttributes = 
  { [Role.kick]:
    { colorMod(n, time) 
      { return n == 255 ? 50: n }
    , text: '#' 
    , rgb: [155, 50, 0]
    }
  , [Role.tenor]:
    { colorMod(n, time) 
      { return n == 255 ? 100: n }
    , text: '\\-'
    , rgb: [155, 250, 0]
    }
  , [Role.alto]:
    { colorMod(n, time) 
      { return n == 255 ? 175: n }
    , text: '=/'
    , rgb: [0, 150, 50]
    }
  , [Role.hat]:
    { colorMod(n, time) 
      { return 255 }
    , text: '@' 
    , rgb: [0, 150, 255]
    }
  }

const Presets = 
  { [Clan.Yellow]: 
    { tonic: 88
    , bpm: 70
    , voices:
      { [Role.kick]: [0, 5, 0, 7]
      // { [Role.kick]: [0, 0, 0, 0]
      , [Role.tenor]: [0, 5, NaN, 5]
      , [Role.alto]: [7, 2, NaN]
      , [Role.hat]: [12, 4, NaN, 12, 7, NaN, 4, 7]
      }
    }
  , [Clan.Blue]: 
    { tonic: 80
    , bpm: 93.333
    , voices: 
      { [Role.kick]: [0, 1, 3, 0]
      , [Role.tenor]: [4, 4, 2, 4]
      , [Role.alto]: [7, 4, 7, NaN]
      , [Role.hat]: [12, NaN, NaN, 0]
      }
    }
  , [Clan.Red]: 
    { tonic: 52
    , bpm: 93.333
    , voices: 
      // { [Role.kick]: [7, NaN, NaN, 0]
      { [Role.kick]: [0, NaN, NaN, 0]
      , [Role.tenor]: [4, 4, 2, 4]
      , [Role.alto]: [7, 4, 7, NaN]
      , [Role.hat]: [12, NaN, NaN, 0]
      }
    }
  
  }


  const Songs = 
    { "opening":
      { tonic: 84
      , bpm: 132
      , voices:
        { [Role.kick]: [0, NaN, 0, 3, 0, NaN, 0, 4,0,NaN,0,7,9,5,7,2]
        , [Role.tenor]: [3,3,3,3,4,4,4,4,7,7,7,7,10,10,10,10]
        , [Role.alto]: [NaN,5,NaN,5,NaN,7,NaN,7,NaN,2,NaN,2,NaN,5,NaN,5]
        , [Role.hat]: [10, NaN, NaN, NaN, 11, NaN, NaN, NaN, NaN,  11, NaN, NaN, NaN, NaN,  10, NaN, NaN, NaN, NaN, ]
        }
      }
    }
  

  const mods = 
    [(t,state) => floor(downScale(t,(state.level*2)+ 5) % 255)
    ,(t,state) => floor(downScale(t, 51 + state.level) % 255)
    ,(t,state) => floor(downScale(t, 91 - state.level) % 255)
    ,(t,state) => floor(t + 223 % 20)]


  const useMod = (n,time,state) =>
    mods[n % mods.length](time,state)


  /** 
   * Create an object with new properties from previous object
   * 
   * Golfy workaround for game 13k submission
   * Since the spread operator is compiled to `Object.assign()`, 
   * this lets us name our own copy of the method. 
   */
  const assign = (params, defaults = {}) => 
    Object.assign({}, defaults, params)


  const collides = (unit, obj): Boolean => {
    if (unit.objectID == obj.objectID) 
      return false

    return !(
      unit.x > obj.x + obj.width ||
      unit.x + obj.width < obj.x ||
      unit.y > obj.y + obj.height ||
      unit.y + obj.height < obj.y
    );
  }


  const applyDroneDamage = (role, ensemble): Ensemble => {
    const next = {...ensemble}
    const mirrors = 
      [ [Role.kick, Role.hat ]
      , [Role.tenor, Role.alto] ]
    
    let dmg = 0
    for( let duo of mirrors) {
      if (duo.includes(role)) {
        dmg = (duo[0] == role)
          ? 1
          : 2

        next[role].volume = next[role].volume - dmg
      }
    }

    return next
  }


  const touchHandlers = 
    { drone(state: State, touches) {
        const ensemble = touches.reduce((ensemble, drone) => 
          applyDroneDamage(state.room.role, state.ensemble), touches)

        const defenderIDs = touches.map(drone => drone.objectID)

        const drones = state.drones.filter(drone => 
          !defenderIDs.includes(drone.objectID))

        const pickups = state.pickups.concat(touches.map(drone => createPickup(drone)))

        return assign({drones, ensemble,pickups},state)
    } 
    , element(state: State, touches) {
      log(`doing element`)
        if (state.level == 0 && touches.length > 1) {
          // prevent multiple collisions when there are 3 nodes
          return state
        }

        const element = touches[0]
        const room = 
          { clan: element.clan
          , role: (state.level == 0) ? Role.kick : element.role }

          // sidefx
        const ensemble = addToEnsemble(state.ensemble, room.clan, room.role)
        return assign(
          { ensemble
          , room
          , drops: []
          , level: state.level + 1}, state) }
    , shot(state, touches) {
        //shot doesn't do anything to the player
        return state;
      }
    , pickup(state, touches) {
        const ids = touches.map(pickup => pickup.objectID)
        const pickups = state.pickups.filter(pickup =>
          !ids.includes(pickup.objectID))

        const ensemble = addToEnsemble(state.ensemble, state.room.clan, state.room.role, 1)
        return assign({ensemble, pickups}, state)
      }
    }


// settings you can tweak to resize the characters and stages
const canvasWidth = min(1200,window.innerWidth)
const canvasHeight = min(800,window.innerHeight)
const playerHeight = 80
const playerWidth = 80
const droneWidth = 50
const droneHeight = 50
const elementRadius = min(100, canvasWidth/6)

const config = {
  canvasWidth,
  canvasHeight
}


/* Global unique ID generator. */
const objectID = () => {
 return objectID.prev++
}
objectID.prev = 0


/* The end of game has been reached, auto-refresh for the player. */
const reloadGame = () => {
  window.location.reload()
}


/* Make a big number smaller */
const downScale = (n, scale = 3) => n * pow(10,-(scale))


/* Debugger to prevent clogging the terminal. */
const throttle = (seconds = 2) => 
  setTimeout(() => {debugger},seconds*1000)


/* Opposite of isNaN */
const aN: (a:any) => boolean = n => 
  (!isNaN(n) && typeof n == 'number')


/* Turns an RGB array to an "rgb(255,255,255)"" value */
const toColor = (rgb: RGB, mod = (n, time) => n): string => {
  if (rgb.length != 3) {
    return ''
  }

  const [r,g,b] = rgb.map(mod).map(n => n.toString())
  return `rgb(${r},${g},${b})`
}


/* Gets a random integer in your range */
const randomInt = (min = 0, max = 1) => 
  floor(random() * (floor(max) - ceil(min) + 1)) + ceil(min);


/* logger */
const log = (...any: any[]): SideFX => 
  <void><unknown> any.forEach(a=>console.log(a))


/* Random boolean value */
const coinToss = (): boolean =>
  (Math.random() < 0.5)


/* Determines if unit is near the canvas edges */
const isNearWall = <U extends UnitPosition>(u: U, threshold = 0.1): boolean => 
  (u.x <= canvasWidth * threshold) && (u.y <= canvasHeight * threshold)


/* Move a unit a random amount in a certain direction */
const walk = (u: Drone, step = 1 ): Drone => {
  let direction = u.lastwalk ? 'x' : 'y'
  return (
    { ...u
    , lastwalk: !u.lastwalk
    , [direction]: coinToss() ? u[direction] + 1 : u[direction] - 1
    })
} 


const moveLeft = <U extends UnitPosition>(u: U , amt=7): U => 
  assign({x: u.x > 0 ? u.x-= amt : 0}, u) 


const moveRight = <U extends UnitPosition>(u: U, amt=7): U => 
  assign({x: u.x < (canvasWidth - playerWidth) ? u.x += amt : (canvasWidth - playerWidth)}, u)


const moveUp = <U extends UnitPosition>(u: U, amt=7): U  => 
  assign({y: u.y >= (0) ? u.y -= amt : playerHeight}, u)


const moveDown = <U extends UnitPosition>(u: U, amt=7): U  => 
  assign({y: u.y <= (canvasHeight) ? u.y += amt : (canvasHeight)}, u)


const createShot = (opts = {}): Shot => 
  assign(opts, 
    { objectID: objectID()
    , name: 'shot'
    , x: 0
    , y: 0
    , radius: 0
    , dr: (time, shot, index) => {
      const maxRadius = floor(canvasWidth/3)
      const progress = (+new Date - shot.start)/(shot.duration)
      if (progress > 1) {
        return 0
      }

      return floor(maxRadius * progress)
    }
    , start: (+new Date)
    , duration: 2000
    })


const createPlayer = (): Player => 
  ({ objectID: objectID()
    , name: 'player'
    , width: playerWidth
    , height: playerHeight
    , x: (canvasWidth)/2
    , y: canvasHeight / 5
    , volume: 100
    , speed: 100
    , luck: 100
    })


const createDrone = (defaults = {}): Drone => {
  const bias = 0.7; // favor the center of the room
  return assign(
    { objectID: objectID()
    , name: 'drone'
    , x: bias * Math.random() * canvasWidth
    , y: bias * Math.random() * canvasHeight
    , width: 40
    , height: 40
    , lastwalk: false
    }, <Drone>defaults)
}


const createPickup = (defaults = {}) => 
  assign(
    { objectID: objectID()
    , name: 'pickup'
    }, defaults)


const createOpeningMusicDrops = (qty = 3) => {
  const drops = []
  const containerWidth = canvasWidth*2/qty
  const offsetWall = canvasWidth/qty
  const offsetCeiling = (canvasHeight+elementRadius)/2
  const elWidth = containerWidth/qty

  for (let i = 0; i < 3; i++) {
    const x = offsetWall + (i*elWidth)
    const y = offsetCeiling 
    drops.push(createMusicDrop({x, y, role: Role.kick, clan: Clan[Clan[i]]}))
  }
  return drops
}


const createMusicDrop = (opts = {}) => 
  assign(opts,
    { clan: ''
    , x: 0
    , y: 0
    , radius: elementRadius
    , dr: (time, element) => floor(elementRadius * abs(sin((element.objectID)+downScale(time))))
    , width: 0
    , height: 0
    , ...opts // do not allow name or objectID to be initialized
    , name: 'element'
    , objectID: objectID()
    })


const motionControls = () => (
  { ArrowRight: moveRight
  , ArrowLeft: moveLeft
  , ArrowDown: moveDown
  , ArrowUp: moveUp
  })


const applyMotion = (player, controlKey): Player => {
  let map = motionControls()
  if (! (Object.keys(map).includes(controlKey)))
    return player

  return map[controlKey](player)
}


/* Respond to the keydown controls */
const applyControls = (time, state: State): State => {
  let shots = state.shots

  if (game.controls.includes('f')) {
    shots = shots.concat(createShot({start: (+new Date), x: state.player.x, y: state.player.y, duration: 200}))
    game.controls = game.controls.filter(k => k!='f')
  }


  const isInProgress = (shot) =>
    1 !== (floor((+new Date) / (shot.start + (shot.duration))))

  return assign(
    { shots: shots.filter(isInProgress)
    , player: game.controls.reduce(applyMotion,state.player)
    }, state)
}


const updateRadial = (unit, time) => {
  const radius = unit.dr(time, unit)
  return assign({radius, width: radius/2, height: radius/2}, unit)
}


/* Update the x,y,width,height,radius properties of units in state. */
const applyPositions = (time, state: State): State => 
  assign(
    { shots: state.shots.map((u) => updateRadial(u, +new Date))
    , drops: state.drops.map((u) => updateRadial(u, time))
    , drones: state.drones.map(walk)
    }, state)


const applyToTree = (tree: QTInterface, u): QTInterface => {
  tree.insert(u)
  return tree
}


/* Global handler for store state updates */
const updateTreeIndices = <Tree>(time, state: State, tree: Tree): Tree => {
  return (
    [ state.player
    , ...state.drones
    , ...state.drops
    , ...state.shots]).reduce(applyToTree, tree)
}


const handleDroneCollisions = (drones: Drone[], tree: QTInterface): any[] => 
  drones.reduce((collisions, drone) => {
    const intersections = tree.retrieve(drone).filter((unit) => collides(unit, drone))
    return collisions.concat(intersections)
  }, [])



const applyShotCollisions = (state, tree): State => {
  const allTouches = state.shots.map(shot => tree.retrieve(shot))
  const touches = allTouches.reduce((a, x) => [...a,...x], [])
  const defenderIDs = touches.map(drone => drone.objectID)

  // destroy on contact
  const drones = state.drones.filter(drone => 
    !defenderIDs.includes(drone.objectID))

  return {...state, drones}
}


const addToEnsemble = (ensemble: Ensemble, clan: Clan, key: Role, amt = 2): Ensemble => {
  if  (ensemble[key].clan != clan) {
    const preset = Presets[clan]
    // Swap the previous type with the new one
    ensemble[key].clan = clan
    ensemble[key].volume = amt
    ensemble[key].bpm = preset.bpm
    ensemble[key].tonic = preset.tonic
    ensemble[key].melody = preset.voices[key]
  } else {
    ensemble[key].volume += amt
  }
  return ensemble
}


function getSynth(role: Role): Synth {
  const roles = 
    { [Role.kick]: partKick
    , [Role.tenor]: partHarmony
    , [Role.alto]: partLead
    , [Role.hat]: partHat
    }
    return (roles[role] || partHarmony)
}



// reindexes the list to start at `index`
function beatmatch(index, list: any[]) {
  return [...list.concat().slice(index, list.length), ...list.concat().slice(0, index)]
}


const choppy = x => 
 0.5


const shortening = x => {
  let duration = 1/(x+1)
  return duration
} 


const tenuto = x => 
  0.85


const sostenuto = x => 
  0.99


const getDuration = (role: Role) => {
  const roles = 
    { [Role.kick]: choppy
    , [Role.tenor]: tenuto
    , [Role.alto]: sostenuto
    , [Role.hat]: shortening
    }
    return (roles[role] || tenuto)
}

function game() {
  const controls: Controls = []
  const state: State = 
    { player: createPlayer()
    , ensemble:
      { [Role.kick]: <SoundSource>{ volume: 1 }
      , [Role.tenor]: <SoundSource>{ volume: 1 }
      , [Role.alto]: <SoundSource>{ volume: 1 }
      , [Role.hat]: <SoundSource>{ volume: 1 }
      }
    , drones: []
    , shots: []
    , pickups: []
    , drops: createOpeningMusicDrops()
    , room: <Room><unknown>{ clan: null, role: Role.kick }
    , level: 0
    }



  const play = (now, role: Role, part) => {
    if (part.volume == 1) {
      if (typeof part.sequencer != 'undefined') {
        part.sequencer.stop()
        delete part.sequencer
      }
      return
    }

    const synth = getSynth(role)
    const beat = getBeatIndex(now, part.bpm, part.melody)

    // start the first one
    if (typeof part.sequencer == 'undefined') {
      const notes = intervalsToMelody(part.tonic, getDuration(role), part.melody)
      const play = synth(now, part.bpm, notes)
      part.sequencer = play()
      part.sequencer.osc.onended = (): SideFX => {
        delete part.sequencer
      }
      return
    }

    // set up the next loop
    if ((typeof part?.sequencer?.osc.onended == 'undefined') && beat == (part.melody.length - 1)) {
      const beatWidth = getBeatLength(part.bpm)
      const notes = intervalsToMelody(part.tonic, getDuration(role), part.melody)
      part.sequencer.osc.onended = (): SideFX => {
        delete part.sequencer
      }
    }
  }
  

  const playMusicEnsemble = (now: number, ensemble: Ensemble) => {
    Object.entries(ensemble).forEach(([key, part]) => play(now, parseInt(key), part))
  }


  const updateSound = (state: State, ctx: AudioContext): SideFX => {
    const { ensemble } = state

    // if ( state.level == 0 ) {
    //   playMusicEnsemble(ctx.currentTime, Songs.opening)
    // } else {
      playMusicEnsemble(ctx.currentTime, state.ensemble)
    // }
    
  }


  const isPlayerDead = ensemble => 
    // @ts-ignore
    Object.values(ensemble).some(part => part.volume == 0)


  const isEnsembleComplete = ensemble => 
    // @ts-ignore
    Object.values(ensemble).every(part => part.volume >= 5)


  const drawNPCS: StatefulDraw = (time, state): Draw => {
    const cAttrs = clanAttributes[state.room.clan]
    const rAttrs = roleAttributes[state.room.role]

    // use measuretext here because it depends on the ctx
    // it is a sidefx that should go in applyMotion instead
    return (ctx) => {
      ctx.font = '50px monospace'
      state.drones.forEach( (drone,i) => {
        const {x,y} = drone
        const text = rAttrs.text
        const metrics = ctx.measureText(text)
        drone.width = metrics.width
        ctx.fillStyle = toColor(cAttrs.rgb, rAttrs.colorMod)
        ctx.fillText(text, floor(x+droneWidth), floor(y+droneHeight))  
      } )
    }
  }


  const drawPickups: StatefulDraw = (time, state): Draw => {
    const cAttrs = clanAttributes[state.room.clan]
    const rAttrs = roleAttributes[state.room.role]

    // use measuretext here because it depends on the ctx
    // it is a sidefx that should go in applyMotion instead
    return (ctx) => {
      ctx.font = '50px monospace'
       state.pickups.forEach( (pickup, i) => {
        const {x,y} = pickup
        ctx.fillStyle = 'white'
        ctx.fillRect(x, y, droneWidth, droneHeight)
      })
    }
  }


 


  const drawShots: StatefulDraw = (time, state): Draw => {
    return (ctx) => {
      state.shots.forEach((shot,i) => {
        ctx.strokeStyle = toColor([(shot.x+shot.y)%100,shot.x%255,shot.y%200])
        ctx.arc(shot.x, shot.y, shot.radius, 0, 2*PI)
        ctx.lineWidth = (time % 20)
        ctx.stroke()
      })
    }
  }


  const drawDrops: StatefulDraw = (time, state): Draw => {
    const rgb = [0,0,0]
    return (ctx) => {
      drawDoors(ctx, state.room.clan)
      state.drops.forEach( ({x,y,width,height},i) => {
        for (let j =0; j < 3; j++) {
          rgb[i] = 255
          const offset =  + downScale(time) + (PI*j/4)
          const endpoint = (Math.PI/4) + offset
          ctx.fillStyle = toColor(rgb)
          ctx.arc(x, y, 30, offset, endpoint);
          ctx.stroke();
          ctx.fill();
        }
      } )
    }
  }


  const drawUI= (time, state, illustrate) => {
    const uiW = 300
    const uiH = 200
    const orbR = 10
    const m = (min(uiW, uiH) - 50) / 4
    const qty = 4
    const max = 10
    
    // background
    illustrate((ctx) => {
      ctx.font = '15px sans-serif'
      ctx.lineWidth = 10
      ctx.strokeStyle = 'black'
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(15, 15, uiW, uiH)
      ctx.strokeRect(15, 15, uiW, uiH)
    })

    // progress orbs
    Object.values(state.ensemble).forEach((part, j) => {
      //@ts-ignore
      let progress = ceil(part.volume*qty/max)- 1
      for (let i =0; i<4; i++) {
        illustrate((ctx) => {
          ctx.lineWidth = 2
          const name = Role[j]
          const metrics = ctx.measureText(name)
          let y = m + (orbR * 4 * j) + orbR/2

            let x = 50 + (2 * orbR) + (orbR * 2* i)
            if (i == 0) {
              ctx.lineWidth = 1
              ctx.strokeStyle = 'white'
              ctx.fillText(name, 50, y)
            }
            
            ctx.arc(100 + x, y, orbR, 0, PI*2)
            ctx.strokeStyle = 'white'
            ctx.stroke()
            if (progress >= i) {
              ctx.fillStyle = toColor(roleAttributes[j].rgb)
              ctx.fill()
            }
        })
      }
    })
  }


  const drawPlayer: StatefulDraw = (time, state): Draw => {
    const mainColor = 'white'
    const accent = 'black'
    const text = '!*!' || '?*?'

    return (ctx) => {
      ctx.font = '50px monospace'
      const metrics = ctx.measureText(text)
      state.player.height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      state.player.width = metrics.width
      // Must apply width and height using the ctx
      ctx.fillStyle = mainColor
      ctx.strokeStyle = accent
      ctx.strokeText(text, state.player.x, state.player.y);
      ctx.fillText(text, state.player.x, state.player.y);
    }
  }


  const drawTiles = (time, ctx, state): SideFX => {
    let tw = 90
    let th = 90 + (downScale(time, 3))
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = (i *downScale(time, 3)) % 255
      // let r = useMod(i,time,state)
      for (let j=0;j<ny;j++) {
        let g = useMod(j,time,state)
        let b = useMod(i+j,time,state)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawTiles2 = (time, ctx): SideFX => {
    let tw = 80
    let th = 20 + floor(1.5*tw)
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = (i *downScale(time, 1)) % 255
      for (let j=0;j<ny;j++) {
        let g = (j *downScale(time, 2)) % 255
        let b = useMod(i+j,time,state)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawTiles3 = (time, ctx): SideFX => {
    let tw = 100 + 30
    let th = 120 + 10
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = useMod(3,time,state) % 255
      for (let j=0;j<ny;j++) {
        let g = 0
        let b = useMod(i+j,time,state)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawTiles4 = (time, ctx): SideFX => {
    let tw =  200
    let th =  100
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = useMod(1,time,state) % 255
      for (let j=0;j<ny;j++) {
        let g = 100
        let b = useMod(i+j,time,state)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawDoors = (ctx, clan: Clan): SideFX => {
    let altClans = Object.keys(Clan).map(a => parseInt(a)).filter(c => c !== clan).filter(aN)
    let doorHeight = 40
    let offsetWall = 0
    let doorWidth = 20
    let offsetCeiling = (canvasHeight-doorHeight)/3

    // left door
    ctx.fillStyle = toColor(clanAttributes[altClans[0]].rgb)
    ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight)

    // right door
    ctx.fillStyle = toColor(clanAttributes[altClans[1]].rgb)
    ctx.fillRect(canvasWidth-offsetWall-doorWidth, offsetCeiling, canvasWidth-offsetWall+doorWidth, offsetCeiling + doorHeight)
  }


  const drawRoom: StatefulDraw = (time, state): Draw => {
    let animations = 
      [ drawTiles
      , drawTiles2
      , drawTiles3
      , drawTiles4
      ]
    let render = animations[state.level%animations.length]
    return (ctx) => {
      render(time, ctx, state)
    }
  }


  const addControlKey: ControlListener = (key) => {
    return controls.includes(key) ? controls : controls.concat(key)
  }

  const removeControlKey: ControlListener = (key) => 
    controls.filter(k => k !== key)


  const handleKeydown = (e: KeyboardEvent, time, state): SideFX => {  
    if (e.repeat === true) {
      return
    }

    if (e.key == 'f' && game.controls.includes(e.key)) {
      game.controls = game.controls.filter(k => k !== e.key)
    } else {
      game.controls = game.controls.concat(e.key)
    }

    const remove = () => {
      game.controls = game.controls.filter(k => k !== e.key)
    }

    const cleanup = (ev) => {
      if (e.key === ev.key) {
        remove()
        window.removeEventListener('keyup', cleanup)
      }
    }
    window.addEventListener('keyup', cleanup)
  }


  const getDrones = (qty = 4, drones: Drone[] = []): Drone[] => {
    if ( qty === 0 ) 
      return drones

    drones = drones.concat(createDrone())
    return getDrones(qty-1, drones)
  }


  const drawStage: UpdateStage = (time, state, illustrate) => {
    illustrate( (ctx) => ctx.clearRect(0,0, canvasWidth, canvasHeight))

    if (state.level == 0) {
      openingScene(time, state, illustrate)
      illustrate( drawShots( time, state) )
      drawUI( time, state, illustrate )
      return
    }

    if (state.drops.length > 0) {
      dropScene(time, state, illustrate)
    } else {
      swarmScene(time, state, illustrate)
    }
    drawUI(time, state, illustrate)
  }


  const swarmScene = (time, state, illustrate) => {
    illustrate( drawRoom(time, state) )
    state.drones.length > 0 && illustrate( drawNPCS(time, state) )
    state.pickups.length > 0 && illustrate( drawPickups(time,state))
    state.shots.length > 0 && illustrate( drawShots(time, state))
    illustrate( drawPlayer(time, state) )
  }


  const dropScene = (time, state, illustrate) => {
    // illustrate( drawRoom(time, state) )
    illustrate( drawDrops(time, state) )
    illustrate( drawPlayer(time, state) )
  }


  const updateListeners: UpdateListeners = (time, state) => {
    const listener = (e) => handleKeydown(e, time, state)
    if (typeof updateListeners.prev == 'function') 
      window.removeEventListener('keydown', updateListeners.prev)

    window.addEventListener('keydown', updateListeners.prev = listener)
    return state
  }


  const applyPlayerCollisions = (state, tree): State => {
    const hits = tree.retrieve(state.player).filter((unit) => collides(unit, state.player))
    const next = hits.reduce((next, collider, i, collisions) => 
      assign(touchHandlers[collider.name](state, collisions), next)
    , state)
    return next
  }
 

  const enumKeys = (e) =>
    Object.keys(e).map(a => parseInt(a)).filter(aN)


  /** Create a room with new values compared to a previous room. */
  const nextRoom = (pClan: Clan, pRole: Role,level): Room => {
    const altClans = enumKeys(Clan).filter(k => k!= pClan)
    const clan =altClans[randomInt(0,altClans.length-1)]

    // do hats after kick
    if ( level == 1) {
      return {clan, role: Role.hat}
    }

    // Assign roles based on level for even distribution
    return {clan, role:Role[Role[level%4]]}
  }


  const setupNextLevel = (state: State): State => {
    const room = nextRoom(state.room.clan, state.room.role,state.level)
    const drones = getDrones(state.level * 5)
    return assign({drones, room}, state)
  }


  const setupDrops = (state: State): State => {  
    const element = createMusicDrop(
      { name: 'element'
      , x: canvasWidth / 2
      , y: canvasHeight / 2
      , clan: state.room.clan
      , role: state.room.role
      })
    return assign({drops: [element]}, state)
  }

  const loop: HandleTick = (time, prev: State, draw, tree) => {
    tree.clear()

    let next = applyControls(time, prev)
    next = applyPositions(time, next)
    tree = updateTreeIndices(time, next, tree)
    updateSound(next, audioContext)

    next = applyPlayerCollisions(next, tree)

    if (isEnsembleComplete(next.ensemble)) {
      alert('you are winning!')
    }

    log(`has pickups`, next.pickups)

    if (next.shots.length > 0 && next.drones.length > 0) {
      // shoot at the drones, remove the hits
      let drones = next.shots.reduce((drones, shot,i) => {
        const collisions = tree.retrieve(shot).filter((unit) => collides(unit, shot))
        return drones.filter(drone => !collisions.includes(drone))

      }, next.drones)

      let pickups = next.shots.reduce((pickups, shot,i) => {
        const collisions = tree.retrieve(shot).filter((unit) => collides(unit, shot))
        if (collides(shot, next.player)) {
          return pickups
        }

        return pickups.concat(collisions.map(drone => createPickup(drone)))
      }, next.pickups)

      // next = applyShotCollisions(next, tree)
      next = assign({drones, pickups}, next);
    }
    if(next.shots.length>0){
      log(next.pickups)
    }


    if (isPlayerDead(next.ensemble)) {
      reloadGame()
    }


    if (prev.level != next.level) {
      next = setupNextLevel(next)
    } else if (next.drones.length == 0 && next.drops.length == 0) {
      // The room is clear, provide the drops
      next = setupDrops(next)
    } 

    updateListeners(time, next)
    drawStage(time, next, draw)
    requestAnimationFrame((ntime) => loop(ntime, next, draw, tree))
  }


  const playback: Setup = (state, tick, config) => {
    const {canvasWidth, canvasHeight} = config
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
    document.body.appendChild(canvas)
    
    const scene: Illustrate = (draw: Draw): SideFX  => {
      ctx.beginPath()
      ctx.lineWidth = 8
      draw(ctx)
      ctx.closePath()
    }

    const tree = Quadtree({x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);
    tick(0, state, scene, tree)
  }


  const openingScene = (time, state, illustrate) => {
    const clans = enumKeys(Clan)
    const containerWidth = canvasWidth*2/3
    const offsetWall = canvasWidth/3
    const offsetCeiling = canvasHeight/3
    const elWidth = containerWidth/clans.length
    
    illustrate((ctx) => drawTiles(time, ctx, state))

    state.drops.forEach((unit, i) => {
      illustrate((ctx) => {
        const attrs =clanAttributes[i]
        const rAttrs =roleAttributes[i]
        ctx.fillStyle = ctx.strokeStyle =  toColor(attrs.rgb,rAttrs[i])
        ctx.arc(unit.x, unit.y, unit.radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      })
    })

    illustrate(drawPlayer(time, state))
  }

  playback(state, loop, config)
}



// todo decide if it is worth having a global async controls or use something else
game.controls = []
game()  