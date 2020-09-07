import soundtrack from './sounds'
import { Store } from './store'
document?.querySelector("#play").addEventListener('click', soundtrack)
import {Sequence, partLead, partHarmony, partBass, intervalsToMelody, ac as audioContext } from './Sequencer'

enum Role 
  { Bass
  , Tenor
  , Alto
  , Soprano
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
  { strength: number
  , speed: number
  , luck: number
  }


type ShieldMeta = 
  { clan: Clan | Empty, strength: number }


type Shield = 
  { [Role.Bass]: ShieldMeta
  , [Role.Tenor]: ShieldMeta
  , [Role.Alto]: ShieldMeta
  , [Role.Soprano]: ShieldMeta
  }


type Room = 
  { clan: Clan
  , role: Role
  }


type State = 
  { player: Player
  , drones: Drone[]
  , fx: any[]
  , room: Room
  , level: number
  }


type UnitPosition = Bounds & 
  { z?: number 
  , lastwalk?: boolean
  }


type TouchZone = UnitPosition & 
  { onCreate?: () => SideFX
  , onEnter?: () => SideFX
  , onCollision?: () => SideFX
  }

interface Bounds  
  { x: number, y: number, width: number, height: number}


interface ControlListener
    { (key: string): Controls }


interface Game
 { (): SideFX
  controls: Controls }


interface CreateRoom
  { (clan: Clan, role: Role): Room }


interface HandleTick
  { (time: DOMHighResTimeStamp, state: State, draw: Illustrate): SideFX }


interface Render
  { (state: State): Empty }


interface Illustrate 
  { (d: Draw) : SideFX }


interface Setup
  { (state: State, tick: HandleTick): SideFX }


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

type Rect = 
  { x: number
  , y: number
  , dx: number
  , dy: number 
  }


interface QTInterface
  { box: any[]
  , nodes: QTInterface[]
  , insert: (bounds) => void
  , split: () => void
  , getIndex: (bounds) => void
  , clear: () => void
  , retrieve: (bounds) => any
  }


type ModulationMap =
  { [key: string]: GetNumber }


type Controls = string[]


type Empty = null | undefined


type SideFX = void


type Player = UnitPosition & Stats & { name: string, shield: Shield }


type Drone = UnitPosition &
  { shield: number, name: string }


// global constants
const canvasWidth = 800
const canvasHeight = 450
const playerHeight = 80
const playerWidth = 80


const tree = new Store({x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);


const aN: (a:any) => boolean = n => !isNaN(n)


const log = (...any: any[]): SideFX => 
  <void><unknown> any.map(a => console.log(a))


const coinToss = (): boolean =>
  (Math.random() < 0.5)


const isNearWall = <U extends UnitPosition>(u: U, threshold = 0.1): boolean => {
  return (u.x <= canvasWidth * threshold) && (u.y <= canvasHeight * threshold)
}


const walk = <U extends UnitPosition>(u: U, step = 1 ): U => {
  let p = u.lastwalk ? 'x' : 'y'
  u[p] = coinToss() ? u[p] + 1 : u[p] - 1
  u.lastwalk = !u.lastwalk
  return u
} 


const off = (el, name, fn) => 
  el.removeEventListener(name, fn)


const on = (el, name, fn) => {
  el.addEventListener(name, fn)
  return function cleanup() {off(el, name, fn)}
}


const throttle = (seconds = 2) => 
  setTimeout(() => {debugger},seconds*1000)


const changePosition = <T extends Object>(prev: T, changes: any): T  => {
  return Object.keys(prev).reduce((next, key) => {
    return (typeof changes[key] == 'undefined')
      ? next
      : {...next, [key]: changes[key](prev[key])}
    }, <T>{})
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
  const { player, fx } = state
  const origin = 
    { x: player.x
    , y: player.y
    }
  return (
    { ...state
    , fx: fx.concat({type: 'attack', origin})
    })
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


const game: Game = () => {
  
  const applyControls = (time, state: State): State => {
    return (
      {...state
      , player: game.controls.reduce(applyMotion,state.player)
      , fx: state.fx.reduce(applyActions,state.fx)
      , drones: state.drones.map(walk)
      })
  }

  
  const createRoom: CreateRoom = (clan, role) => (
    { clan
    , role
    })


  const createShield = () => {
    return {
      bass: 0,
      tenor: 0,
      alto: 0,
      soprano: 0
    }
  }


  const createPlayer = (): Player => {
    return (
    { name: 'player'
    , shield: 
      { [Role.Bass]: {clan: null, strength: 0}
      , [Role.Tenor]: {clan: null, strength: 0}
      , [Role.Alto]: {clan: null, strength: 0}
      , [Role.Soprano]: {clan: null, strength: 0}
      }
    , width: playerWidth
    , height: playerHeight
    , x: canvasWidth - playerWidth
    , y: 10
    , strength: 100
    , speed: 100
    , luck: 100
    })
  }


  const createDrone = (defaults = {}): Drone => {
    return Object.assign(
      { name: 'drone'
      , x: Math.random() * canvasWidth
      , y: Math.random() * canvasHeight
      , width: 40
      , height: 40
      , shield: 2
      , lastwalk: false
      }, <Drone>defaults )
  }


  const createShieldDrop = (defaults = {}) => {
    return Object.assign(
      { name: 'shield'
      , clan: ''
      , x: Math.random() * canvasWidth
      , y: Math.random() * canvasHeight
      , width: 40
      , height: 40
      }, defaults )
  }


  const getClanColor = (clan: Clan): string => (
    { [Clan.Red]: 'red'
    , [Clan.Blue]: 'blue'
    , [Clan.Yellow]: 'yellow'
    })[clan]


  const getClanText = (clan: Clan): string => (
    { [Clan.Red]: '+'
    , [Clan.Blue]: '#'
    , [Clan.Yellow]: '/'
    })[clan]

  
  const getClanAttributes = (clan: Clan) => (
    { color: getClanColor(clan)
    , text: getClanText(clan)
    })


  const drawNPCS: StatefulDraw = (time, state): Draw => {
    const {color, text} = getClanAttributes(state.room.clan)
    let uw = 50
    let uh = 50
    return (ctx) => {
      state.drones.forEach( ({x,y, shield},i) => {
        ctx.fillStyle = color
        //@ts-ignore
        ctx.fillText(text.repeat(shield), x, y)  
      } )
    }
  }


  const drawPlayer: StatefulDraw = (time, state): Draw => {
    const color = drawPlayer.color || (drawPlayer.color = 'white')
    const text = drawPlayer.text || (drawPlayer.text ='!*!')
    return (ctx) => {
      ctx.fillStyle = color
      ctx.fillText(text, state.player.x, state.player.y);
    }
  }


  const drawTiles = (time, ctx): SideFX => {
    let tw = 80
    let th = 80
    let nx = canvasWidth / tw
    let ny = canvasHeight / th
    ctx.stokeStyle = 'cyan'


    for (let i=0;i<nx;i++) {
      let r = (i *tiny(time, 2)) % 255
      for (let j=0;j<ny;j++) {
        let g = (j *tiny(time, 1)) % 255
        let b = (i+j *tiny(time, 2)) % 255
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
        ctx.strokeRect(i*tw, j*th, i*tw + tw, j*tw+tw)
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
    ctx.fillStyle = getClanColor(altClans[0])
    ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight)

    // right door
    ctx.fillStyle = getClanColor(altClans[1])
    ctx.fillRect(canvasWidth-offsetWall-doorWidth, offsetCeiling, canvasWidth-offsetWall+doorWidth, offsetCeiling + doorHeight)
  }


  const drawRoom: StatefulDraw = (time, state): Draw => {
    return (ctx) => {
      drawTiles(time, ctx)
      drawDoors(ctx, state.room.clan)
      ctx.strokeStyle = "black"
      ctx.strokeRect(0, 0, 600, 600)
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
      openingRoom(time, state, illustrate)
    } else {
      stage(time, state, illustrate)
    }
  }


  const stage = (time, state, illustrate) => {
    illustrate( drawRoom(time, state) )
    illustrate( drawNPCS(time, state) )
    illustrate( drawPlayer(time, state) )
  }


  const updateListeners: UpdateListeners = (state) => {
    if (typeof updateListeners.listen == 'function')
      window.removeEventListener('keydown', updateListeners.listen)

    updateListeners.listen = (e) => handleKeydown(e)
    window.addEventListener('keydown', updateListeners.listen)
    return updateListeners.prev || []
  }


  const applyToTree = <U extends UnitPosition>(tree: QTInterface, u: U): QTInterface => {
    tree.insert(u)
    return tree
  }


  function addOpeningShieldsToTree(time, tree) {

    const clans = Object.keys(Clan).map(a => parseInt(a)).filter(aN)
    const containerWidth = canvasWidth*2/3
    const offsetWall = canvasWidth/3
    const offsetCeiling = canvasHeight/3
    const elWidth = containerWidth/clans.length
    
    for(let i = 0; i < clans.length; i++) {
      const x = offsetWall + (i*elWidth)
      const y = offsetCeiling // * ((Math.cos(time * (i*0.25)/100)))
      const radius = 1+ 40 * abs(sin((1+i)*tiny(time)))
      tree.insert({name: `shield-${Clan[i]}`, clan: Clan[i], x, y, width: radius/2, height: radius/2})
    }

    return tree
  }


  const updateTreeIndices = <T>(time, state: State, tree: T) => {
    let items: any[] = []
    if ( state.level == 0 ) {
      addOpeningShieldsToTree(time, tree)
    } else {
      items = items.concat(state.drones)
    }

    items = items.concat(state.player)
    return items.reduce(applyToTree, tree)
  }


  const handleCollisions = (state, tree): State => {
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

    return handleTouches(state, intersections.filter(collides))
  }


  const applyShield = (player: Player, clan: Clan, role: Role): Player => {
    const boon = 2
    if  (player.shield[role].clan != clan) {
      // Swap the previous shield type with the new one
      player.shield[role].clan = clan
      player.shield[role].strength = boon
    } else {
      player.shield[role].strength += boon
    }
    return player
  }


  const handleTouches = (state, touches): State => {
    if (touches.length == 0)
      return state

    if ( state.level == 0) {
      // first room is a bass shield pickup
      if (touches.length == 1) {
        const player = applyShield(state.player, touches[0].clan, Role.Bass)
        return {...state, player, level: state.level + 1}
      }
    }
    return state
  }


  const setupNextLevel = (state: State): State => {
    const room = nextRoom( state.room.clan, state.room.role )
    const drones = getDrones(state.level * 2)
    return {...state, drones, room}
  }

  
  const loop: HandleTick = (time, prev: State, draw) => {
    tree.clear()
    let next = applyControls(time, prev)
    updateTreeIndices(time, next, tree)
    next = handleCollisions(next, tree)

    if ( prev.level != next.level ) {
      next = setupNextLevel(next)
      return requestAnimationFrame((ntime) => loop(ntime, next, draw))
    }

    updateListeners(next)
    drawStage(time, next, draw)
    requestAnimationFrame((ntime) => loop(ntime, next, draw))
  }


  /** Grabs the rendering context to provide render callback. */
  const go: Setup = (state, tick) => {

    const canvas = <HTMLCanvasElement> window.document.querySelector("canvas")
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
    ctx.font = '50px monospace'
    const draw: Illustrate = (d: Draw): SideFX  => {
      ctx.beginPath()
      d(ctx)
      ctx.closePath()
    }

    tick(0, state, draw)
  }


  const { abs, sin, cos, pow } = Math
  const tiny = (n, scale = 3) => n * pow(10,-(scale))
  const controls: Controls = []
  const state: State = 
    { player: createPlayer()
    , drones: []
    , fx: []
    , room: <Room><unknown>{ clan: null, role: null }
    , level: 0
    }


  const openingRoom = (time, state, illustrate) => {
    const clans = Object.keys(Clan).map(a => parseInt(a)).filter(aN)
    const containerWidth = canvasWidth*2/3
    const offsetWall = canvasWidth/3
    const offsetCeiling = canvasHeight/3
    const elWidth = containerWidth/clans.length
    
    illustrate((ctx) => drawTiles(time, ctx))

    for(let i = 0; i < clans.length; i++) {
     
      illustrate((ctx) => {
        const x = offsetWall + (i*elWidth)
        const y = offsetCeiling // * ((Math.cos(time * (i*0.25)/100)))
        const radius = 1+ 40 * abs(sin((1+i)*tiny(time)))
        const unit = createShieldDrop({x, y, width: radius, height: radius, clan: Clan[i]})
        unit.width = radius
        unit.height = radius

        ctx.fillStyle = ctx.strokeStyle = getClanColor(i)
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      } )
    }
    illustrate( drawPlayer(time, state) )

  }


  // saved preset for showing two elements orbiting around a central unit
  const orbit = (time,state,illustrate) => {
    const radius = 100 
    const clans = Object.keys(Clan).map(a => parseInt(a)).filter(aN)
    const containerWidth = canvasWidth/2
    const offsetWall = canvasWidth/3
    const offsetCeiling = canvasHeight/3
    const elWidth = containerWidth/clans.length

    for( let i = 0; i < clans.length; i++) {
      illustrate( (ctx) => {
        let y = offsetWall + (elWidth * i) * ((Math.cos(time * (i*0.25)/100)))
        let x = canvasHeight * (Math.abs(Math.sin(time * 0.125/1000)))
        ctx.fillStyle = ctx.strokeStyle = getClanColor(i)
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
      } )
    }
  }


  /** Create a room with new values compared to a previous room. */
  const nextRoom = (pClan: Clan, pRole: Role): Room => {
    const altClans = Object.keys(Clan).map(a => parseInt(a)).filter(c => (c !== pClan) && aN(c))
    const altRoles = Object.keys(Role).map(a => parseInt(a)).filter(r => (r !== pRole) && aN(r))
    
    return (
      { clan: altClans[Number(coinToss())]
      , role: altRoles[Number(coinToss())]
      })
  }

  go(state, loop)
}


const getSoundtrackParts = (clan: Clan, role: Role): [number,number][] => {
  const notes = []
  return notes
}


const Yellow = 
  { tonic: 80
  , bpm: 70
  , voices:
    { bass: [0, 3, 4, 5, 3, 5, 12, 7]
    , tenor: [0, 5, NaN, 5]
    , alto: [2, 2, NaN]
    , soprano: [7, 7, NaN, 9, 7, 7, 9, 13]
    }
  }


const Red = 
  { tonic: 1066.66
  , bpm: 105
  , voices: 
    { bass: [7, 0, 7, 7]
    , tenor: [3, 3, 2, 3, 5, 3, 2, 0]
    , alto: [NaN, 5, 3, 5]
    , soprano: [10, NaN, NaN, 10, 12, 11, 9, NaN]
    }
  }


function playEnsemble(ensemble = Red) {
  const { tonic, bpm, voices } = ensemble
  const now = audioContext.currentTime

  Object.entries(voices).map(([voice, melody]) => {
    const notes = intervalsToMelody(ensemble.tonic, (i) => 1/(i+1), melody)
    log(`using voice:${voice}`)
    log(`using melody:`,melody)
    log(`got notes`, notes)
    const seq = new Sequence(ensemble.bpm, notes)
    const parts = 
      { 'bass': partBass
      , 'tenor': partHarmony
      , 'alto': partLead
      , 'sorpano': partHarmony
      }
    const part = parts[voice] || partHarmony
    const play = part(now, ensemble.bpm, notes)
    play()
  })
}


// todo decide if it is worth having a global async controls or use something else
game.controls = []
game()
document?.querySelector("#play").addEventListener('click', () => playEnsemble(Yellow))
