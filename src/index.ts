import {Quadtree} from './store'
import {S as Sequence, Synth, partLead, partKick, partHat, intervalsToMelody, ac as audioContext, getBeatLength, getBeatIndex} from './Sequencer'
const { abs, sin, cos, pow, sqrt, floor, ceil, random, PI, max, min } = Math


enum Role 
  { kick
  , tenor
  , alto
  , hat
  }


enum Clan
  { B
  , C 
  , A
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
  { [Clan.C]: 
    { rgb: [255,0,0]
    }
  , [Clan.B]: 
    { rgb: [0,0,255]
    }
  , [Clan.A]:
    { rgb: [0,255,0]
    }
  }


const roleAttributes = 
  { [Role.kick]:
    { colorMod(n, time) 
      { return time %2 ? 255: 0 }
    , text: 'K' 
    , rgb: [255, 50, 0]
    }
  , [Role.tenor]:
    { colorMod(n, time) 
      { return time %2 ? 255: 0 }
    , text: 'T'
    , rgb: [255, 250, 0]
    }
  , [Role.alto]:
    { colorMod(n, time) 
      { return n == 255 ? 175: n }
    , text: 'A'
    , rgb: [0, 250, 50]
    }
  , [Role.hat]:
    { colorMod(n, time) 
      { return 255 }
    , text: 'H' 
    , rgb: [0, 250, 255]
    }
  }

const Presets = 
  { [Clan.A]: 
    { tonic: 88
    , bpm: 70
    , voices:
      { [Role.kick]: [0, 5, 0, 7]
      , [Role.tenor]: [4, 7, 2, 5]
      , [Role.alto]: [12, 4, 0]
      , [Role.hat]: [12, 4, 0, 12, 7, 0, 4, 7]
      }
    }
  , [Clan.B]: 
    { tonic: (88*4/3)
    , bpm: 10.5
    , voices: 
      { [Role.kick]: [7, 0, 4, 12, 0, 0, 0, 12]
      , [Role.tenor]: [4, 0, 4]
      , [Role.alto]: [0, 4, 7]
      , [Role.hat]: [10, 0, 0, 10, 12, 11, 9, 0]
      }
    }
  , [Clan.C]: 
    { tonic: (88* 5/4)
    , bpm: 140
    , voices: 
      { [Role.kick]: [0, 12, 7, 0]
      , [Role.tenor]: [12, 4, 7]
      , [Role.alto]: [7, 4, 7, 0]
      , [Role.hat]: [10, 0, 0, 10, 12, 11, 9, 0]
      }
    }
  
  }

  const mods = 
    [(t,x) => scale(t,(x*2)+ 5)
    ,(t,x) => scale(t, 51 + x)
    ,(t,x) => scale(t, 91-x)
    ,(t,x) => t/x
    ,(t,x) => scale(t,4) / x
    ,(t,x) => scale(t,3) / ((x+1)*2)
    ,(t,x) => x+100
    ,(t,x) => t - (x * 5)
    ,(t,x) => t + 223 % 20]


  const useMod = (n,time,level) =>
    floor(mods[n % mods.length](time,level)) % 255


  /** 
   * Create an object with new properties from previous object
   * 
   * Golfy workaround for game 13k submission
   * Since the spread operator is compiled to `Object._()`, 
   * this lets us name our own copy of the method. 
   */
  const _ = (params, defaults = {}) => 
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

        return _({drones, ensemble,pickups},state)
    } 
    , element(state: State, touches) {
        if (touches.length<1) 
          return;
        if (state.level == 0 && touches.length != 1) {
          // prevent multiple collisions when there are 3 nodes
          return state
        }

        const room = 
          { clan: touches[0]?.clan || 0
          , role: (state.level == 0) ? Role.kick : touches[0].role }

        return _(
          { ensemble: addToEnsemble(state.ensemble, room.clan, room.role)
          , room
          , drops: []
          , level: state.level + 1}, state) }
    , shot(state, touches) {
        //shot doesn't do anything to the player
        return state;
      }
    , pickup(state, touches) {

        // picks up one at a time
        const ids = touches.map(pickup => pickup.objectID)
        const pickups = state.pickups.filter(pickup =>
          !ids.includes(pickup.objectID))
        const ensemble = addToEnsemble(state.ensemble, state.ensemble[state.room.role].clan || state.room.clan, state.room.role, 1)
        return _({ensemble, pickups}, state)
      }
    }


// settings you can tweak to resize the characters and stages
const cw = min(1200,window.innerWidth)
const ch = min(800,window.innerHeight)
const playerHeight = 80
const playerWidth = 80
const droneWidth = 50
const droneHeight = 50
const elementRadius = min(100, cw/6)

const config = {
  cw, //canvas height
  ch // canvas width 
} // code golf is lame


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
const scale = (n, scale = 3) => n * pow(10,-(scale))


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


/* Random boolean value */
const coinToss = (): boolean =>
  (Math.random() < 0.5)


/* Determines if unit is near the canvas edges */
const isNearWall = <U extends UnitPosition>(u: U, threshold = 0.1): boolean => 
  (u.x <= cw * threshold) && (u.y <= ch * threshold)


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
  _({x: u.x > 0 ? u.x-= amt : 0}, u) 


const moveRight = <U extends UnitPosition>(u: U, amt=7): U => 
  _({x: u.x < (cw - playerWidth) ? u.x += amt : (cw - playerWidth)}, u)


const moveUp = <U extends UnitPosition>(u: U, amt=7): U  => 
  _({y: u.y >= (0) ? u.y -= amt : playerHeight}, u)


const moveDown = <U extends UnitPosition>(u: U, amt=7): U  => 
  _({y: u.y <= (ch) ? u.y += amt : (ch)}, u)


const createShot = (opts = {}): Shot => 
  _(opts, 
    { objectID: objectID()
    , name: 'shot'
    , x: 0
    , y: 0
    , radius: 0
    , dr: (time, shot, index) => {
      const maxRadius = floor(cw/3)
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
    , x: (cw)/2
    , y: ch / 5
    , volume: 100
    , speed: 100
    , luck: 100
    })


const createDrone = (defaults = {}): Drone => {
  const bias = 0.7; // favor the center of the room
  return _(
    { objectID: objectID()
    , name: 'drone'
    , x: bias * Math.random() * cw
    , y: bias * Math.random() * ch
    , width: 40
    , height: 40
    , lastwalk: false
    }, <Drone>defaults)
}


const createPickup = (defaults = {}) => 
  _(
    { objectID: objectID()
    , name: 'pickup'
    }, defaults)


const startup = (qty = 3) => {
  const drops = []
  const containerWidth = cw*2/qty
  const offsetWall = cw/qty
  const offsetCeiling = (ch+elementRadius)/2
  const elWidth = containerWidth/qty

  for (let i = 0; i < 3; i++) {
    const x = offsetWall + (i*elWidth)
    const y = offsetCeiling 
    drops.push(createDrop({x, y, role: Role.kick, clan: Clan[Clan[i]]}))
  }
  return drops
}


const createDrop = (opts = {}) => 
  _(opts,
    { clan: ''
    , x: 0
    , y: 0
    , radius: elementRadius
    , dr: (time, element) => floor(elementRadius * abs(sin((element.objectID)+scale(time))))
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

  return _(
    { shots: shots.filter(isInProgress)
    , player: game.controls.reduce(applyMotion,state.player)
    }, state)
}


const updateRadial = (unit, time) => {
  const radius = unit.dr(time, unit)
  return _({radius, width: radius/2, height: radius/2}, unit)
}


/* Update the x,y,width,height,radius properties of units in state. */
const applyPositions = (time, state: State): State => 
  _(
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
    , ...state.pickups
    , ...state.shots]).reduce(applyToTree, tree)
}


const handleDroneCollisions = (drones: Drone[], tree: QTInterface): any[] => 
  drones.reduce((collisions, drone) => {
    const intersections = tree.retrieve(drone).filter((unit) => collides(unit, drone))
    return collisions.concat(intersections)
  }, [])




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
    , [Role.tenor]: partLead
    , [Role.alto]: partLead
    , [Role.hat]: partHat
    }
    return (roles[role] || partLead)
}


const getDuration = (role: Role) => 
  (
    { [Role.kick]: x =>0.5
    , [Role.tenor]: x =>(x%2==1)? 0.85:05
    , [Role.alto]: x=>0.95
    , [Role.hat]: x =>1/(x+1)
    })[role]

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
    , drops: startup()
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
      part.sequencer.o.onended = (): SideFX => {
        delete part.sequencer
      }
      return
    }

    // set up the next loop
    if ((typeof part?.sequencer?.o.onended == 'undefined') && beat == (part.melody.length - 1)) {
      const beatWidth = getBeatLength(part.bpm)
      const notes = intervalsToMelody(part.tonic, getDuration(role), part.melody)
      part.sequencer.o.onended = (): SideFX => {
        delete part.sequencer
      }
    }
  }
  

  const updateSound = (state: State, ctx: AudioContext): SideFX => {
    Object.entries(state.ensemble).forEach(([key, part]) => play(ctx.currentTime, parseInt(key), part))
  }



  const isComplete = ensemble => 
    // @ts-ignore
    Object.values(ensemble).every(part => part.volume >= 6)


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
          rgb[i] = time / i % 255
          const offset = 0 + scale(time) + (PI*j/4)
          const endpoint = (Math.PI/4) + offset
          ctx.fillStyle = toColor(rgb)
          ctx.arc(x, y, 30, offset, endpoint);
          ctx.stroke();
          ctx.fill();
        }
      } )
    }
  }


  const drawUI= (time, state, ill) => {
    const uiW = 300
    const uiH = 200
    const orbR = 10
    const m = (min(uiW, uiH) - 50) / 4
    const qty = 4
    const max = 10
    
    // background
    ill((ctx) => {
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
        ill((ctx) => {
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


  const dTiles = (time,s,level) => 
    (ctx) => {
      for (let i=0; i<cw/s;i++) {
        let r = (i *scale(time, level + 3)) % 255
        for (let j=0; j<ch/s; j++) {
          let g = useMod(j,scale(time),level)
          let b = useMod(j+level,scale(time),level)
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
          ctx.fillRect(i*s -i, j*s -j, i*s + s, j*s+s)
        }
      }
    }


  const drawDoors = (ctx, clan: Clan): SideFX => {
    let alt = enumKeys(Clan)
    let y = 40
    let x = 0
    let doorWidth = 20
    let offY = (ch-y)/3

    // left door
    ctx.fillStyle = toColor(clanAttributes[alt[0]].rgb)
    ctx.fillRect(x, offY, x + doorWidth, offY + y)

    // right door
    ctx.fillStyle = toColor(clanAttributes[alt[1]].rgb)
    ctx.fillRect(cw-x-doorWidth, offY, cw-x+doorWidth, offY + y)
  }


  const addControlKey: ControlListener = (key) => 
    controls.includes(key) ? controls : controls.concat(key)


  const removeControlKey: ControlListener = (key) => 
    controls.filter(k => k !== key)


  const handleKeydown = (e: KeyboardEvent, time, state): SideFX => {  
    if (e.repeat === true) 
      return

    (e.key == 'f' && game.controls.includes(e.key))
      ? game.controls = game.controls.filter(k => k !== e.key)
      : game.controls = game.controls.concat(e.key)

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


  const getDrones = (qty = 4, drones: Drone[] = [], player: Player): Drone[] => {
    if ( qty === 0 ) 
      return drones

    let drone = createDrone()
    // prevent collision on spawn
    return collides(drone, player)
      ? getDrones(qty, drones, player)
      : getDrones(qty-1, drones.concat(drone), player)
  }


  const drawStage: UpdateStage = (time, state, ill) => {
    ill( (ctx) => ctx.clearRect(0,0, cw, ch))

    if (state.level == 0) {
      ill(dTiles(time + 1500, 30, state.level))
      openingScene(time, state, ill)
      ill( drawShots( time, state) )
      drawUI( time, state, ill )
      return
    }

    state.drops.length > 0
      ? dropScene(time, state, ill)
      : swarmScene(time, state, ill)

    drawUI(time, state, ill)
  }


  const swarmScene = (time, state, ill) => {
    ill( dTiles(time, 30 , state.level))
    ill( drawNPCS(time, state) )
    ill( drawPickups(time,state))
    ill( drawShots(time, state))
    ill( drawPlayer(time, state) )
  }


  const dropScene = (time, state, ill) => {
    ill( drawDrops(time, state) )
    ill( drawPlayer(time, state) )
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
      _(touchHandlers[collider.name](state, collisions), next)
    , state)
    return next
  }
 

  const enumKeys = (e) =>
    Object.keys(e).map(a => parseInt(a)).filter(aN)


  /** Create a room with new values compared to a previous room. */
  const nextRoom = (c: Clan, level): Room => {
    const alt = enumKeys(Clan).filter(k => k!= c)

    // Assign roles based on level for even distribution
    return {
      clan: alt[randomInt(0,alt.length-1)]
      , role:level%4}
  }


  const setupNextLevel = (state: State): State => {
    const room = nextRoom(state.room.clan, state.level)
    const drones = getDrones(1+floor(state.level*1.5), [], state.player)
    return _({drones, room, pickups: []}, state)
  }


  const setupDrops = (state: State): State => {  
    const element = createDrop(
      { name: 'element'
      , x: cw / 2
      , y: ch / 2
      , clan: state.room.clan
      , role: state.room.role
      })
    return _({drops: [element]}, state)
  }

  const loop: HandleTick = (time, prev: State, draw, tree) => {
    tree.clear()

    let next = applyControls(time, prev)
    next = applyPositions(time, next)
    tree = updateTreeIndices(time, next, tree)
    updateSound(next, audioContext)

    next = applyPlayerCollisions(next, tree)


    if (isComplete(next.ensemble)) {
      alert('Good job you winner!')
    }


    if (next.shots.length > 0 && next.drones.length > 0) {
      // shoot at the drones
      let drones = next.shots.reduce((drones, shot,i) => {
        const collisions = tree.retrieve(shot).filter((unit) => collides(unit, shot))
        return drones.filter(drone => !collisions.includes(drone))
      }, next.drones)

      let hits = next.drones.filter(d => !drones.includes(d))

      // replace a hit with a pickup
      let pickups = hits.reduce((pickups, drone,i) => 
        pickups.concat(createPickup(drone))
      , next.pickups)

      next = _({drones, pickups}, next);
    }

    
    // player died 
    if (Object.values(next.ensemble).some(part => part.volume < 1)) {
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
    const {cw, ch} = config
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    let ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
    document.body.appendChild(canvas)
    
    const scene: Illustrate = (draw: Draw): SideFX  => {
      ctx.beginPath()
      ctx.lineWidth = state.level % 4 + 6
      draw(ctx)
      ctx.closePath()
    }

    const tree = Quadtree({x: 0, y: 0, width: cw, height: ch }, 3, 4);
    tick(0, state, scene, tree)
  }


  const openingScene = (time, state, ill) => {
    const clans = enumKeys(Clan)
    const width = cw*2/3
    const offsetWall = cw/3
    const offsetCeiling = ch/3

    state.drops.forEach((unit, i) => {
      for(let j =0;j<3;j++) {
        ill((ctx) => {
          const attrs =clanAttributes[i]
          const rAttrs =roleAttributes[i]
          ctx.fillStyle = ctx.strokeStyle =  toColor(attrs.rgb)
          ctx.arc(unit.x, (scale(time) / (j+2)) + unit.y, unit.radius, time + j/PI, time + (i* PI/4) + PI/4)
          ctx.fill()
          ctx.stroke()
        })
      }
    })

    ill(drawPlayer(time, state))
    ill((ctx) => {
      ctx.font = '25px sans-serif';
      ([`Use the arrow keys to move`
       , `Choose your Bassline`
       , `Press F to fire`
       , `Daze the drones to collect their essence`
       , `Assemble all 4 parts to find your track!`]).reduce((y,t) =>(ctx.fillText(t,50, ch-y), (y-50)), 250)
    })
  }

  playback(state, loop, config)
}



// todo decide if it is worth having a global async controls or use something else
game.controls = []
game()  