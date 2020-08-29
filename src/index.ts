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


type Shield = 
  { bass: number
  , tenor: number
  , alto: number
  , soprano: number 
  }


type Room = 
  { clan: Clan
  , role: Role
  , prev: Room | Empty
  }


type State = 
  { player: Player
  , drones: Drone[]
  , room: Room
  }


type UnitPosition =  
  { x: number
  , y: number
  , z?: number 
  , lastwalk?: Boolean
  }


// type Peripherals =
//   { keydown: any[]
//   , click: 
//   , cursor: }


interface CreateRoom
  { (clan: Clan, prev: Room): Room }


interface HandleTick
  { (controls: any, state: State): State }


interface Render
  { (state: State): Empty }


interface Illustrate 
  { (d: Draw) : SideFX }


interface Setup
  { (): Illustrate }


interface UpdateStage
  { (state: State, draw: Illustrate): SideFX }


interface Draw
  { (ctx: CanvasRenderingContext2D): SideFX }


interface StatefulDraw
  { (state: State): Draw }


interface IsNearWall<T extends UnitPosition>
  { (u: T): boolean }


interface GetNumber
  { (x: number, ...yz: number[]): number }


type ModulationMap =
  { [key: string]: GetNumber }


interface Modulate<T extends Object>
  { (prev: T, changes: ModulationMap ): T }



const controls: any[] = []


type Controls = string[]


type Empty = null | undefined


type SideFX = void


type Player = UnitPosition & Stats


type Drone = UnitPosition &
  { shield: number }


// global constants

const width = 900
const height = 900


const aN: (a:any) => boolean = n => !isNaN(n)


const log = (...any: any[]): SideFX => 
  <void><unknown> any.map(a => console.log(a))


const isNearWall: IsNearWall<UnitPosition> = (u, threshold = 0.1) => {
  return (u.x <= width * threshold) && (u.y <= height * threshold)
}


const walk = <U extends UnitPosition>(u: U, step = 1 ): U => {
  let p = u.lastwalk ? 'x' : 'y'
  u[p] = (Math.random() < 0.5) ? u[p] + 1 : u[p] - 1
  u.lastwalk = !u.lastwalk
  return u
} 


const off = (el, name, fn) => 
  el.removeEventListener(name, fn)


const on = (el, name, fn) => {
  el.addEventListener(name, fn)
  return function cleanup() {off(el, name, fn)}
}


const throttle = () => 
  setTimeout(() => {debugger},2000)


const changePosition = <T extends Object>(prev: T, changes: any): T  => {
  return Object.keys(prev).reduce((next, key) => {
    return (typeof changes[key] == 'undefined')
      ? next
      : {...next, [key]: changes[key](prev[key])}
    }, <T>{})
}



const moveLeft = (player, amt=1): Player => (
  {...player, x: player.x -= amt}
)



const moveRight = (player, amt=1): Player => (
  {...player, x: player.x += amt}
)



// type PlayerControlMap =
//   { [controlKey: string]: Modulate<PlayerControl> }


const applyControl = (player, controlKey): Player => (
  { ArrowRight: moveRight
  , ArrowLeft: moveLeft
  // , ArrowDown: land
  // , ArrowUp: jump
  })[controlKey](player)


function play() {
 
  
  const updatePositions = (state: State, controls: Controls): State => {
    // state.drones.map(d => walk(d))
    state.drones.map(walk)

    let player = controls.reduce(applyControl,state.player)

    return {...state, player, drones: state.drones.map(walk)}
  }

  
  const createRoom: CreateRoom = (clan, prev) => {
    return (
      { clan
      , prev
      , role: Role.Bass
      })
  }


  const createShield = () => {
    return {
      bass: 0,
      tenor: 0,
      alto: 0,
      soprano: 0
    }
  }


  const createPlayer = (): Player => {
    return {
      x: 10,
      y: 30,
      ...(createShield()),
      strength: 100,
      speed: 100,
      luck: 100
    }
  }


  const createDrone = (): Drone => {
    return (
      { x: 30
      , y:23
      , shield: 2
      , lastwalk: false
      } )
  }


  const getClanColor = (clan: Clan): string => (
    { [Clan.Red]: 'red'
    , [Clan.Blue]: 'blue'
    , [Clan.Yellow]: 'yellow'
    })[clan]


  const drawNPCS: StatefulDraw = (state): Draw => {
    const color = getClanColor(state.room.clan)
    let uw = 50
    let uh = 50
    return (ctx) => {
      state.drones.forEach( ({x,y},i) => {
        ctx.fillStyle = color
        ctx.fillRect(x, y, x+uw, y+uh)  
      } )
    }
  }


  const drawTiles = (ctx): SideFX => {
    let tw = 80
    let th = 80
    let nx = width / tw
    let ny = height / th
    ctx.fillStyle = 'grey'
    ctx.stokeStyle = 'cyan'

    for (let i=0;i<nx;i++) 
      for (let j=0;j<ny;j++) {
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
        ctx.strokeRect(i*tw, j*th, i*tw + tw, j*tw+tw)
      }
  }


  const drawDoors = (ctx, clan: Clan): SideFX => {
    let altClans = Object.keys(Clan).filter(c => parseInt(c) !== clan).map(a => parseInt(a)).filter(aN)
    let doorHeight = 40
    let offsetWall = 0
    let doorWidth = 20
    let offsetCeiling = (height-doorHeight)/3

    // left door
    ctx.fillStyle = getClanColor(altClans[0])
    ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight)

    // right door
    ctx.fillStyle = getClanColor(altClans[1])
    ctx.fillRect(width-offsetWall-doorWidth, offsetCeiling, width-offsetWall+doorWidth, offsetCeiling + doorHeight)
  }


  const drawRoom: StatefulDraw = (state): Draw => {
    return (ctx) => {
      drawTiles(ctx)
      drawDoors(ctx, state.room.clan)
      ctx.strokeStyle = "black"
      ctx.strokeRect(0, 0, 600, 600)
    }
  }


  /** Grabs the rendering context to provide render callback. */
  const setupCanvas: Setup = () => {
    const canvas = <HTMLCanvasElement> window.document.querySelector("canvas")
    canvas.width = 900
    canvas.height = 900

    const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
    const handleDraw: Illustrate = (d: Draw): SideFX  => {
      ctx.beginPath()
      d(ctx)
      ctx.closePath()
    }

    const handleKeypress = (e: KeyboardEvent): SideFX => {  
      const off = on(canvas, 'keydown', handleKeypress)  
    }

    return handleDraw
  }



  const addControlKey = (e: KeyboardEvent, list: string[]): string[] => {
    return (e.repeat === true) 
      ? list
      : list.concat(e.key)
      return list
  }


  const getDrones = (qty = 4, drones: Drone[] = []): Drone[] => {
    if ( qty === 0 ) 
      return drones

    drones = drones.concat(createDrone())
    return getDrones(qty-1, drones)
  }


  const updateStage: UpdateStage = (state, ill) => {
    ill( (ctx) => ctx.clearRect(0,0,900,900) )
    ill( drawRoom(state) )
    ill( drawNPCS(state) )
  }


  const draw = setupCanvas()
  const state = 
    { player: createPlayer()
    , drones: getDrones()
    , room: { clan: Clan.Yellow, prev: null, role: Role.Bass }
    }


  /** Parses controls and actions and resolves to a new state. */
  const handleTick: HandleTick = (controls, state): State => {
    state = updatePositions(state, controls)
    return state
  }


  const tick = (time: DOMHighResTimeStamp) => {
    const nextState = handleTick(controls, state)
    updateStage(nextState, draw)
    requestAnimationFrame(tick)
  }


  tick(0)

  
}


play()