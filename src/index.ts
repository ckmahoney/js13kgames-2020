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


const controls: any[] = []


type Empty = null | undefined


type SideFX = void


type Player = UnitPosition & Stats


type Drone = UnitPosition &
  { shield: number }


const aN: (a:any) => boolean = n => !isNaN(n)


const log = (...any: any[]): SideFX => 
  <void><unknown> any.map(a => console.log(a))


function play() {
  const width = 900
  const height = 900

  /** Parses controls and actions and resolves to a new state. */
  const handleTick: HandleTick = (controls, state): State => {
    return state
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
      } )
  }


  const getClanColor = (clan: Clan): string => (
    { [Clan.Red]: 'red'
    , [Clan.Blue]: 'blue'
    , [Clan.Yellow]: 'yellow'
    })[clan]


  const drawNPCS: StatefulDraw = (state): Draw => {
    const color = getClanColor(state.room.clan)
    return (ctx) => {
      state.drones.forEach( (unit,i) => {
        const {x, y} = unit
        ctx.fillStyle = color
        ctx.fillRect(i*19, i*31, 50 + (i*2), 50 + (i*2))  
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
    log(offsetCeiling + doorHeight)
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

    return handleDraw
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


  const tick = (time: DOMHighResTimeStamp) => {
    const nextState = handleTick(controls, state)
    updateStage(nextState, draw)
    requestAnimationFrame(tick)
  }

  tick(0)
}

play()