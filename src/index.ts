import {Quadtree} from './store'
import {Sequence, Synth, partLead, partHarmony, partBass, intervalsToMelody, ac as audioContext, getBeatLength, getBeatIndex} from './Sequencer'
const { abs, sin, cos, pow, sqrt, floor, ceil, random, PI } = Math


enum Role 
  { bass
  , tenor
  , alto
  , soprano
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


type State = 
  { player: Player
  , drones: Drone[]
  , drops: any[]
  , room: Room
  , level: number
  , ensemble: Ensemble
  }


type UnitPosition = Bounds & 
  { objectID: number
    name: string
    lastwalk?: boolean
  }


type ModulationMap =
  { [key: string]: GetNumber }


type Controls = string[]


type Empty = null | undefined


type SideFX = void


type Player = UnitPosition & Stats & { name: string }


type Drone = UnitPosition &
  { shield: number
    name: string
  }


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
  { [Role.bass]: SoundSource
  , [Role.tenor]: SoundSource
  , [Role.alto]: SoundSource
  , [Role.soprano]: SoundSource
  }


type RGB =
  [number,number,number] | number[]


interface Bounds  
  { x: number
  , y: number
  , width: number
  , height: number
  , radius?: number 
  , dx?: Function
  , dy?: Function
  , dr?: Function
}


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
    { (state: State): Controls
      prev?: Controls
      listen?: (e: KeyboardEvent) => SideFX }


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
  { [Role.bass]:
    { colorMod(n, time) 
      { return n == 255 ? 50: n }
    , text: '#' 
    }
  , [Role.tenor]:
    { colorMod(n, time) 
      { return n == 255 ? 100: n }
    , text: '\\-'
    }
  , [Role.alto]:
    { colorMod(n, time) 
      { return n == 255 ? 175: n }
    , text: '=/'
    }
  , [Role.soprano]:
    { colorMod(n, time) 
      { return 255 }
    , text: '@' }
  }


const Presets = 
  { [Clan.Yellow]: 
    { tonic: 80
    , bpm: 70
    , voices:
      { [Role.bass]: [0, 5, 0, 7]
      , [Role.tenor]: [0, 5, NaN, 5]
      , [Role.alto]: [7, 2, NaN]
      , [Role.soprano]: [12, 4, NaN, 12, 7, NaN, 4, 7]
      }
    }
  , [Clan.Red]: 
    { tonic: 160
    , bpm: 93.333
    , voices: 
      { [Role.bass]: [7, 0]
      , [Role.tenor]: [4, 4, 2, 4]
      , [Role.alto]: [NaN, 7, 4, 7]
      , [Role.soprano]: [12, NaN, NaN, 0]
      }
    }
  , [Clan.Blue]:
    { tonic: 320
    , bpm: 124.44/2
    , voices: 
      { [Role.bass]: [12, 0, NaN, 0]
      , [Role.tenor]: [0, 4, 0]
      , [Role.alto]: [7, NaN, 12]
      , [Role.soprano]: [4, NaN, NaN, 12, 7, 4, 7, NaN]
      }
    }
  }


  const Songs = 
    { "opening":
      { tonic: 84
      , bpm: 132
      , voices:
        { [Role.bass]: [0, NaN, 0, 3, 0, NaN, 0, 4,0,NaN,0,7,9,5,7,2]
        , [Role.tenor]: [3,3,3,3,4,4,4,4,7,7,7,7,10,10,10,10]
        , [Role.alto]: [NaN,5,NaN,5,NaN,7,NaN,7,NaN,2,NaN,2,NaN,5,NaN,5]
        , [Role.soprano]: [10, NaN, NaN, NaN, 11, NaN, NaN, NaN, NaN,  11, NaN, NaN, NaN, NaN,  10, NaN, NaN, NaN, NaN, ]
        }
      }
    }


  const applyDroneDamage = (role, ensemble): Ensemble => {
    const next = {...ensemble}
    const mirrors = 
      [ [Role.bass, Role.soprano ]
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

        // destroy on contact
        const drones = state.drones.filter(drone => 
          !defenderIDs.includes(drone.objectID))

        return {...state, drones} }

    , element(state: State, touches) {
        if (state.level == 0 && touches.length > 1) {
          // prevent multiple collisions when there are 3 nodes
          return state
        }

        const element = touches[0]
        const room = 
          { clan: element.clan
          , role: (state.level == 0) ? Role.bass : element.role }
        const ensemble = addToEnsemble(state.ensemble, room.clan, room.role)

        return (
          { ...state
            , ensemble
            , room
            , drops: []
            , level: state.level + 1} ) }

    , buff(state) {

      return state }
    }


const canvasWidth = window.innerWidth
const canvasHeight = window.innerHeight
const playerHeight = 80
const playerWidth = 80
const droneWidth = 50
const droneHeight = 50
const elementRadius = 30

const config = {
  canvasWidth,
  canvasHeight
}


const tiny = (n, scale = 3) => n * pow(10,-(scale))


const throttle = (seconds = 2) => 
  setTimeout(() => {debugger},seconds*1000)


const aN: (a:any) => boolean = n => 
  (!isNaN(n) && typeof n == 'number')


const toColor = (rgb: RGB, mod = (n, time) => n): string => {
  if (rgb.length != 3) {
    return ''
  }

  const [r,g,b] = rgb.map(mod).map(n => n.toString())
  return `rgb(${r},${g},${b})`
}


const randomInt = (min = 0, max = 1) => 
  floor(random() * (floor(max) - ceil(min) + 1)) + ceil(min);


const log = (...any: any[]): SideFX => 
  <void><unknown> any.map(a => console.log(a))


const coinToss = (): boolean =>
  (Math.random() < 0.5)


const isNearWall = <U extends UnitPosition>(u: U, threshold = 0.1): boolean => 
  (u.x <= canvasWidth * threshold) && (u.y <= canvasHeight * threshold)


const walk = <U extends UnitPosition>(u: U, step = 1 ): U => {
  let direction = u.lastwalk ? 'x' : 'y'
  return (
    { ...u
    , lastwalk: !u.lastwalk
    , [direction]: coinToss() ? u[direction] + 1 : u[direction] - 1
    })
} 


const moveLeft = <U extends UnitPosition>(u: U , amt=7): U => 
  ({...u, x: u.x > 0 ? u.x-= amt : 0})


const moveRight = <U extends UnitPosition>(u: U, amt=7): U => 
  ({...u, x: u.x < (canvasWidth - playerWidth) ? u.x += amt : (canvasWidth - playerWidth)})


const moveUp = <U extends UnitPosition>(u: U, amt=7): U  => 
  ({...u, y: u.y >= (0) ? u.y -= amt : playerHeight})


const moveDown = <U extends UnitPosition>(u: U, amt=7): U  => 
  ({...u, y: u.y <= (canvasHeight) ? u.y += amt : (canvasHeight)})


const fire = <U extends UnitPosition>(time, state: State): State => {
  const { player, drops } = state
  const origin = 
    { x: player.x
    , y: player.y
    }
  return (
    { ...state
    , drops: drops.concat({type: 'attack', origin})
    })
}


const objectID = () => {
 //@ts-ignore property prev does not exist on object of type 
 if (typeof objectID.prev == 'undefined') 
 //@ts-ignore
   objectID.prev = 0

 //@ts-ignore
 return objectID.prev++
}


const createPlayer = (): Player => {
  return (
  { objectID: objectID()
  , name: 'player'
  , width: playerWidth
  , height: playerHeight
  , x: canvasWidth - playerWidth
  , y: 10
  , volume: 100
  , speed: 100
  , luck: 100
  })
}


const createDrone = (defaults = {}): Drone => {
  const bias = 0.7; // favor the center of the room
  return Object.assign(
    { objectID: objectID()
    , name: 'drone'
    , x: bias * Math.random() * canvasWidth
    , y: bias * Math.random() * canvasHeight
    , width: 40
    , height: 40
    , lastwalk: false
    }, <Drone>defaults )
}


const createOpeningMusicDrops = (qty = 3) => {
  const drops = []
  const containerWidth = canvasWidth*2/qty
  const offsetWall = canvasWidth/qty
  const offsetCeiling = canvasHeight/qty
  const elWidth = containerWidth/qty

  for (let i = 0; i < 3; i++) {
    const x = offsetWall + (i*elWidth)
    const y = offsetCeiling 
    const radius = 1+ 40 * abs(sin((1+i)))
    drops.push(createMusicDrop({x, y, radius, role: Role.bass, clan: Clan[Clan[i]]}))
  }
  return drops
}


const createMusicDrop = (defaults = {}) => {
  return Object.assign(
    { objectID: objectID()
    , name: 'element'
    , clan: ''
    , x: 0
    , y: 0
    , radius: elementRadius
    , dr: (time, index = 1) => 1+ 40 * abs(sin((1+index)*tiny(time)))
    , width: 0
    , height: 0
    }, defaults )
}


const motionControls = () => (
  { ArrowRight: moveRight
  , ArrowLeft: moveLeft
  , ArrowDown: moveDown
  , ArrowUp: moveUp
  })


const actionControls = () => (
  { f: fire
  })


const applyMotion = (player, controlKey): Player => {
  let map = motionControls()
  // @ts-ignore property includes does not exist on type string[]
  if (! (Object.keys(map).includes(controlKey)))
    return player

  return map[controlKey](player)
}


const applyActions = (state, controlKey): State => {
  let map = actionControls()
  // @ts-ignore property includes does not exist on type string[]
  if (! (Object.keys(map).includes(controlKey)))
    return state

  return map[controlKey](state)
}


const applyToTree = <U extends UnitPosition>(time, tree: QTInterface, u: U): QTInterface => {
  let {x, y, width, height, radius} = u

  width = (typeof u.dx == 'function')
    ? u.dx(time, u.x)
    : u.x + width;

  height = (typeof u.dy == 'function')
    ? u.dy(time, u.y)
    : u.y + height;

  if (typeof radius == 'number') {
    radius = (typeof u.dr == 'function')
      ? u.dr(time, radius)
      : radius + sqrt(Math.pow(width,2) + Math.pow(height,2))
    width = height = radius
  }


  tree.insert({...u, x, y, width, height})
  return tree
}


/* Global handler for store state updates */
const updateTreeIndices = <Tree>(time, state: State, tree: Tree): Tree => {
  const next = ([state.player, ...state.drones, ...state.drops]).reduce(function add(tree, u) {
    return applyToTree(time, tree, u)}
    ,tree)
  return next
}


const handleCollisions = (state, tree): any[] => {
  const {player} = state
  const intersections = tree.retrieve({
    x: player.x,
    y: player.y,
    width: player.width,
    height: player.height
  });

  const collides = (unit) => {
    if (unit.name == 'player' ) 
      return false

    return !(
      unit.x > player.x + player.width ||
      unit.x + unit.width < player.x ||
      unit.y > player.y + player.height ||
      unit.y + unit.height < player.y
    );
  }

  return intersections.filter(collides)
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
    { 'bass': partBass
    , 'tenor': partHarmony
    , 'alto': partLead
    , 'sorpano': partHarmony
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
    { 'bass': choppy
    , 'tenor': tenuto
    , 'alto': shortening
    , 'sorpano': sostenuto
    }
    return (roles[role] || tenuto)
}

function game() {
  const controls: Controls = []
  const state: State = 
    { player: createPlayer()
    , ensemble:
      { [Role.bass]: <SoundSource>{ volume: 1 }
      , [Role.tenor]: <SoundSource>{ volume: 1 }
      , [Role.alto]: <SoundSource>{ volume: 1 }
      , [Role.soprano]: <SoundSource>{ volume: 1 }
      }
    , drones: []
    , drops: createOpeningMusicDrops()
    , room: <Room><unknown>{ clan: null, role: Role.bass }
    , level: 0
    }
  
  const applyControls = (time, state: State): State => {
    return (
      {...state
      , player: game.controls.reduce(applyMotion,state.player)
      , drops: state.drops.reduce(applyActions,state.drops)
      , drones: state.drones.map(walk)
      })
  }


  const playMusicEnsemble = (now: number, ensemble: Ensemble) => {
    Object.entries(ensemble).forEach(([role, part]) => {
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
        const notes = intervalsToMelody(part.tonic, getDuration(role), beatmatch(beat, part.melody))
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
    })
  }


  const updateSound = (state: State, ctx: AudioContext): SideFX => {
    const { ensemble } = state

    // if ( state.level == 0 ) {
    //   playMusicEnsemble(ctx.currentTime, Songs.opening)
    // } else {
      playMusicEnsemble(ctx.currentTime, state.ensemble)
    // }
    
  }


  const drawNPCS: StatefulDraw = (time, state): Draw => {
    const cAttrs = clanAttributes[state.room.clan]
    const rAttrs = roleAttributes[state.room.role]
    return (ctx) => {
      state.drones.forEach( ({x,y},i) => {
        ctx.fillStyle = toColor(cAttrs.rgb, rAttrs.colorMod)
        ctx.fillText(rAttrs.text.repeat(2), x+droneWidth, y+droneHeight)  
      } )
    }
  }


  const drawDrops: StatefulDraw = (time, state): Draw => {
    const rgb = [0,0,0]
    return (ctx) => {
      drawDoors(ctx, state.room.clan)
      state.drops.forEach( ({x,y,width,height},i) => {
        for (let j =0; j < 3; j++) {
          rgb[i] = 255
          const offset =  + tiny(time) + (PI*j/4)
          const startAngle = 0 + offset
          const endAngle = (Math.PI/4) + offset
          ctx.fillStyle = toColor(rgb)
          ctx.arc(x, y, 30, startAngle, endAngle);
          ctx.stroke();
          ctx.fill();
        }
      } )
    }
  }


  const drawPlayer: StatefulDraw = (time, state): Draw => {
    const mainColor = 'white'
    const accent = 'black'
    const text = '!*!' || '?*?'

    return (ctx) => {
      ctx.fillStyle = mainColor
      ctx.strokeStyle = accent
      ctx.lineWidth = 8;
      ctx.strokeText(text, state.player.x, state.player.y);
      ctx.fillText(text, state.player.x, state.player.y);
    }
  }


  const drawTiles = (time, ctx): SideFX => {
    let tw = 80
    let th = 80
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      // let r = (i *tiny(time, 3)) % 255
      let r = (time) % 255
      for (let j=0;j<ny;j++) {
        let g = (time+(time/j)) % 255
        let b = (time+(time/i)) % 255
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawTiles2 = (time, ctx): SideFX => {
    let tw = 20
    let th = 20
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = (i *tiny(time, 1)) % 255
      for (let j=0;j<ny;j++) {
        let g = (j *tiny(time, 2)) % 255
        let b = (i+j *tiny(time, 4)) % 255
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawTiles3 = (time, ctx): SideFX => {
    let tw = 20
    let th = 20
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = (i *tiny(time, 1 +time%5)) % 255
      for (let j=0;j<ny;j++) {
        let g = (j *tiny(time, time%2)) % 255
        let b = (i+j *tiny(time, time%4)) % 255
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
      }
    }
  }


  const drawTiles4 = (time, ctx): SideFX => {
    let tw = time % 200
    let th = time % 100
    let nx = canvasWidth / tw
    let ny = canvasHeight / th

    for (let i=0;i<nx;i++) {
      let r = (i *tiny(time, 1 +time%5)) % 255
      for (let j=0;j<ny;j++) {
        let g = (j *tiny(time, time%2)) % 255
        let b = (i+j *tiny(time, time%4)) % 255
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
    // let selection = floor(tiny(time,3))%4
    // let render = (
    //   [ drawTiles
    //   , drawTiles2
    //   , drawTiles3
    //   , drawTiles4
    //   ])[selection]
    return (ctx) => {
      drawTiles(time, ctx)
      ctx.strokeStyle = "black"
      ctx.strokeRect(0, 0, 600, 600)
    }
  }


  const drawEnsembleOverlay = (time, state): Draw => {
    return (ctx) => {

    }
  }

  const addControlKey: ControlListener = (key) => {
    // @ts-ignore TS2339
    return controls.includes(key) ? controls : controls.concat(key)
  }

  const removeControlKey: ControlListener = (key) => 
    controls.filter(k => k !== key)


  const handleKeydown = (e: KeyboardEvent): SideFX => {  
    if (e.repeat === true)
      return

    game.controls = game.controls.concat(e.key)
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
      return
    }

    if (state.drops.length > 0) {
      dropScene(time, state, illustrate)
    } else {
      swarmScene(time, state, illustrate)
    }
  }


  const swarmScene = (time, state, illustrate) => {
    illustrate( drawRoom(time, state) )
    illustrate( drawNPCS(time, state) )
    illustrate( drawPlayer(time, state) )
  }


  const dropScene = (time, state, illustrate) => {
    // illustrate( drawRoom(time, state) )
    illustrate( drawDrops(time, state) )
    illustrate( drawPlayer(time, state) )
  }


  const updateListeners: UpdateListeners = (state) => {
    if (typeof updateListeners.listen == 'function')
      window.removeEventListener('keydown', updateListeners.listen)

    updateListeners.listen = (e) => handleKeydown(e)
    window.addEventListener('keydown', updateListeners.listen)
    return updateListeners.prev || []
  }

  const handleTouches = (state, touches): State => {
    if (touches.length == 0)
      return state

    const action = touchHandlers[touches[0].name]
    return action(state,touches);
  }


  const enumKeys = (e) =>
    Object.keys(e).map(a => parseInt(a)).filter(aN)


  /** Create a room with new values compared to a previous room. */
  const nextRoom = (pClan: Clan, pRole: Role): Room => {
    const altClans = enumKeys(Clan).filter(k => k!= pClan)
    const altRoles = enumKeys(Role).filter(k => k!= pRole)
    const clan =altClans[randomInt(0,altClans.length-1)]
    const role = altRoles[randomInt(0,altRoles.length-1)]
    return {clan, role}
  }


  const setupNextLevel = (state: State): State => {
    const room = nextRoom(state.room.clan, state.room.role)
    const drones = getDrones(state.level * 2)
    return {...state, drones, room}
  }


  const setupDrops = (state: State): State => {  
    // const unit = f({x, y, width: radius, height: radius, clan: Clan[i]})
    const element = createMusicDrop(
      { name: 'element'
      , x: canvasWidth / 2
      , y: canvasHeight / 2
      , clan: state.room.clan
      , role: state.room.role
      })
    return {...state, drops: [element]}
  }

  const loop: HandleTick = (time, prev: State, draw, tree) => {
    tree.clear()

    let next = applyControls(time, prev)
    updateTreeIndices(time, next, tree)
    updateSound(next, audioContext)

    const collisions = handleCollisions(next, tree)
    if (collisions.length > 0) {
      next = handleTouches(next, collisions)
    }

    if (Object.values(next.ensemble).some(part => part.volume <= 0)) {
      log(`you got killdead`)
      throw 'done'
    }

    if (prev.level != next.level) {
      next = setupNextLevel(next)
    } else if (next.drones.length == 0 && next.drops.length == 0 ) {
      // The room is clear, provide the drops
      next = setupDrops(next)
    } 

    updateListeners(next)
    drawStage(time, next, draw)
    requestAnimationFrame((ntime) => loop(ntime, next, draw, tree))
  }


  const playback: Setup = (state, tick, config) => {
    const {canvasWidth, canvasHeight} = config
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
    ctx.font = '50px monospace'
    document.body.appendChild(canvas)
    
    const scene: Illustrate = (draw: Draw): SideFX  => {
      ctx.beginPath()
      draw(ctx)
      ctx.closePath()
    }

    const tree = new Quadtree({x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);
    tick(0, state, scene, tree)
  }


  const openingScene = (time, state, illustrate) => {
    const clans = enumKeys(Clan)
    const containerWidth = canvasWidth*2/3
    const offsetWall = canvasWidth/3
    const offsetCeiling = canvasHeight/3
    const elWidth = containerWidth/clans.length
    
    illustrate((ctx) => drawTiles(time, ctx))

    state.drops.forEach((unit, i) => {
      illustrate((ctx) => {
        const attrs =clanAttributes[i]
        const rAttrs =roleAttributes[i]
        const x = offsetWall + (i*elWidth)
        const y = offsetCeiling // * ((Math.cos(time * (i*0.25)/100)))
        const radius = unit.dr(time,i)
        // apply these here so they are stored for next tree insertion
        unit.width = radius
        unit.height = radius

        ctx.fillStyle = ctx.strokeStyle =  toColor(attrs.rgb,rAttrs[i])
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      })
    })

    illustrate(drawPlayer(time, state))
  }

  playback(state, loop, config)
}


const getSoundtrackParts = (clan: Clan, role: Role): [number,number][] => {
  const notes = []
  return notes
}


  /**
the game state must be aware of current global baseline bpm and measure number
it does not need a record of it


  */






// todo decide if it is worth having a global async controls or use something else
game.controls = []
game()  