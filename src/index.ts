enum Role 
  { Bass = "bass"
  , Tenor = "tenor"
  , Alto = "alto"
  , Soprano = "soprano"
  }


enum Clan
  { Blue = "Blades"
  , Red = "Rogues"
  , Yellow = "Djinns"
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
  }


type UnitPosition = { 
  x: number
  , y: number
  , z?: number }


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


const controls: any[] = []


type Empty = null | undefined


type SideFX = void


type Player = UnitPosition & Stats


type Drone = UnitPosition &  Clansmen


function play() {


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
    return {
      role: Role.Bass,
      clan: Clan.Yellow,
      x: 30,
      y:23,
      ...(createShield())
    }
  }


  // const drawDrone: Draw = (ctx, unit: Drone): SideFX => {
  //   const {x, y} = unit
  //   ctx.fillStyle = "rgb(33,99,111)"
  //   ctx.rect(x, y, 50, 50)
  // }


  const drawRoom: Draw = (ctx): SideFX => {
    ctx.strokeStyle = "black"
    ctx.strokeRect(0, 0, 600, 600)
  }


  /** Grabs the rendering context to provide render callback. */
  const setupCanvas: Setup = () => {
    const canvas = <HTMLCanvasElement> window.document.querySelector("canvas")
    canvas.width = 900
    canvas.height = 900
    const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')

    const handleDraw: Illustrate = ( d: Draw ): SideFX  => {
      ctx.beginPath()
      d(ctx)
      ctx.closePath()
    }

    return handleDraw
  }


  const getDrones = (qty = 4) => {
    let drones: Drone[] = []
    for (let i =0; i <qty; i++)
      drones = drones.concat(createDrone())

    return drones
  }


  const updateStage: UpdateStage = (state, ill) => {
    ill( drawRoom )
  }


  const draw = setupCanvas()
  const state = 
    { player: createPlayer()
    , drones: getDrones()
    , room: { clan: Clan.Blue, prev: null, role: Role.Bass }
    }


  const tick = (time: DOMHighResTimeStamp) => {
    const nextState = handleTick(controls, state)
    updateStage(nextState, draw)
    requestAnimationFrame(tick)
  }

  tick()
}

play()