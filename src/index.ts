import soundtrack from './sounds'
import {Sequence, partLead, partHarmony, partBass, intervalsToMelody, ac as audioContext, getBeatLength, getBeatIndex} from './Sequencer'

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
  { strength: number
  , speed: number
  , luck: number
  }


type ShieldMeta = 
  { clan: Clan | Empty, strength: number }


type Shield = 
  { [Role.bass]: ShieldMeta
  , [Role.tenor]: ShieldMeta
  , [Role.alto]: ShieldMeta
  , [Role.soprano]: ShieldMeta
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
  , assemblage: Assemblage
  }


type UnitPosition = Bounds & 
  { z?: number 
  , lastwalk?: boolean
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
  { (time: DOMHighResTimeStamp, state: State, draw: Illustrate, store: any): SideFX }


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


  const clanAttributes = 
    { [Clan.Red]: 
      { text: '><'
      , color: 'red'
      }
    , [Clan.Blue]: 
      { text: '<>'
      , color: 'blue'
      }
    , [Clan.Yellow]:
      { text: '\/'
      , color: 'yellow'
      }
    }


    function Quadtree(bounds, max_objects = 4, max_levels = 10, level = 0) {
        
        this.max_objects    = max_objects || 10;
        this.max_levels     = max_levels || 4;
        
        this.level  = level || 0;
        this.bounds = bounds;
        
        this.objects    = [];
        this.nodes      = [];
    };
    
    
    /**
     * Split the node into 4 subnodes
     */
    Quadtree.prototype.split = function() {
        
        var nextLevel   = this.level + 1,
            subWidth    = this.bounds.width/2,
            subHeight   = this.bounds.height/2,
            x           = this.bounds.x,
            y           = this.bounds.y;        
     
        //top right node
        this.nodes[0] = new Quadtree({
            x       : x + subWidth, 
            y       : y, 
            width   : subWidth, 
            height  : subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        
        //top left node
        this.nodes[1] = new Quadtree({
            x       : x, 
            y       : y, 
            width   : subWidth, 
            height  : subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        
        //bottom left node
        this.nodes[2] = new Quadtree({
            x       : x, 
            y       : y + subHeight, 
            width   : subWidth, 
            height  : subHeight
        }, this.max_objects, this.max_levels, nextLevel);
        
        //bottom right node
        this.nodes[3] = new Quadtree({
            x       : x + subWidth, 
            y       : y + subHeight, 
            width   : subWidth, 
            height  : subHeight
        }, this.max_objects, this.max_levels, nextLevel);
    };
    
    
    /**
     * Determine which node the object belongs to
     * @param Object pRect      bounds of the area to be checked, with x, y, width, height
     * @return Array            an array of indexes of the intersecting subnodes 
     *                          (0-3 = top-right, top-left, bottom-left, bottom-right / ne, nw, sw, se)
     */
    Quadtree.prototype.getIndex = function(pRect) {
        
        var indexes = [],
            verticalMidpoint    = this.bounds.x + (this.bounds.width/2),
            horizontalMidpoint  = this.bounds.y + (this.bounds.height/2);    

        var startIsNorth = pRect.y < horizontalMidpoint,
            startIsWest  = pRect.x < verticalMidpoint,
            endIsEast    = pRect.x + pRect.width > verticalMidpoint,
            endIsSouth   = pRect.y + pRect.height > horizontalMidpoint;    

        //top-right quad
        if(startIsNorth && endIsEast) {
            indexes.push(0);
        }
        
        //top-left quad
        if(startIsWest && startIsNorth) {
            indexes.push(1);
        }

        //bottom-left quad
        if(startIsWest && endIsSouth) {
            indexes.push(2);
        }

        //bottom-right quad
        if(endIsEast && endIsSouth) {
            indexes.push(3);
        }
     
        return indexes;
    };
    
    
    /**
     * Insert the object into the node. If the node
     * exceeds the capacity, it will split and add all
     * objects to their corresponding subnodes.
     * @param Object pRect        bounds of the object to be added { x, y, width, height }
     */
    Quadtree.prototype.insert = function(pRect) {
        
        var i = 0,
            indexes;
         
        //if we have subnodes, call insert on matching subnodes
        if(this.nodes.length) {
            indexes = this.getIndex(pRect);
     
            for(i=0; i<indexes.length; i++) {
                this.nodes[indexes[i]].insert(pRect);     
            }
            return pRect;
        }
     
        //otherwise, store object here
        this.objects.push(pRect);

        //max_objects reached
        if(this.objects.length > this.max_objects && this.level < this.max_levels) {

            //split if we don't already have subnodes
            if(!this.nodes.length) {
                this.split();
            }
            
            //add all objects to their corresponding subnode
            for(i=0; i<this.objects.length; i++) {
                indexes = this.getIndex(this.objects[i]);
                for(var k=0; k<indexes.length; k++) {
                    this.nodes[indexes[k]].insert(this.objects[i]);
                }
            }

            //clean up this node
            this.objects = [];
        }
        return pRect;
     };
     
     
    /**
     * Return all objects that could collide with the given object
     * @param Object pRect      bounds of the object to be checked { x, y, width, height }
     * @Return Array            array with all detected objects
     */
    Quadtree.prototype.retrieve = function(pRect) {
         
        var indexes = this.getIndex(pRect),
            returnObjects = this.objects;
            
        //if we have subnofdes, retrieve their objects
        if(this.nodes.length) {
            for(var i=0; i<indexes.length; i++) {
                returnObjects = returnObjects.concat(this.nodes[indexes[i]].retrieve(pRect));
            }
        }

        //remove duplicates
        returnObjects = returnObjects.filter(function(item, index) {
            return returnObjects.indexOf(item) >= index;
        });
     
        return returnObjects;
    };
    
    
    /**
     * Clear the quadtree
     */
    Quadtree.prototype.clear = function() {
        
        this.objects = [];
     
        for(let i=0; i < this.nodes.length; i++) {
            if(this.nodes.length) {
                this.nodes[i].clear();
              }
        }

        this.nodes = [];
    };


type ModulationMap =
  { [key: string]: GetNumber }


type Controls = string[]


type Empty = null | undefined


type SideFX = void


type Player = UnitPosition & Stats & { name: string }


type Drone = UnitPosition &
  { shield: number, name: string }


// global constants
const canvasWidth = 800
const canvasHeight = 450
const playerHeight = 80
const playerWidth = 80
const droneWidth = 50
const droneHeight = 50



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
      , drops: state.drops.reduce(applyActions,state.drops)
      , drones: state.drones.map(walk)
      })
  }


type Synth = typeof partBass | typeof partHarmony | typeof partLead


function getSynth(role: Role): Synth {
  const roles = 
    { 'bass': partBass
    , 'tenor': partHarmony
    , 'alto': partLead
    , 'sorpano': partHarmony
    }
    return (roles[Role[role]] || partHarmony)
}


// reindexes the list to start at `index`
function beatmatch(index, list: any[]) {
  return [...list.concat().slice(index, list.length), ...list.concat().slice(0, index)]
}


const updateSound = (state: State, ctx: AudioContext): SideFX => {
  const { assemblage } = state

  const now = ctx.currentTime
  Object.entries(assemblage).forEach(([role, part]) => {
    if (part.strength == 0) {
      if (typeof part.sequencer != 'undefined') {
        part.sequencer.stop()
        delete part.sequencer
      }
      return
    }

    const synth = getSynth(Role[role])
    const beat = getBeatIndex(now, part.bpm, part.melody)

    // start the first one
    if (typeof part.sequencer == 'undefined') {
      const notes = intervalsToMelody(part.tonic, x => 1, beatmatch(beat, part.melody))
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
      const notes = intervalsToMelody(part.tonic, x => 1, part.melody)
      part.sequencer.osc.onended = (): SideFX => {
        delete part.sequencer
      }
    }
  })
}

  
  const createRoom: CreateRoom = (clan, role) => (
    { clan
    , role
    })



  const createPlayer = (): Player => {
    return (
    { name: 'player'
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
      , lastwalk: false
      }, <Drone>defaults )
  }


  const createMusicDrop = (defaults = {}) => {
    return Object.assign(
      { name: 'element'
      , clan: ''
      , x: Math.random() * canvasWidth
      , y: Math.random() * canvasHeight
      , width: 40
      , height: 40
      }, defaults )
  }


  const drawNPCS: StatefulDraw = (time, state): Draw => {
    const color = clanAttributes[state.room.clan].color
    const text = clanAttributes[state.room.clan].text
    return (ctx) => {
      state.drones.forEach( ({x,y},i) => {
        ctx.fillStyle = color
        ctx.fillText(text.repeat(2), x+droneWidth, y+droneHeight)  
      } )
    }
  }


  const drawDrops: StatefulDraw = (time, state): Draw => {
    return (ctx) => {
      drawDoors(ctx, state.room.clan)
      state.drops.forEach( ({x,y,width,height},i) => {
        const startAngle = 0 + tiny(time)
        const endAngle = (Math.PI/4) + tiny(time)
        ctx.fillStyle = 'magenta'
        ctx.arc(x, y, 30, startAngle, endAngle);
        ctx.stroke();
        ctx.fill();
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
    ctx.stokeStyle = 'cyan'


    for (let i=0;i<nx;i++) {
      let r = (i *tiny(time, 3)) % 255
      for (let j=0;j<ny;j++) {
        let g = (j *tiny(time, 2)) % 255
        let b = (i+j *tiny(time, 3)) % 255
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
        ctx.fillRect(i*tw -i, j*th -j, i*tw + tw, j*tw+tw)
        // ctx.strokeRect(i*tw, j*th, i*tw + tw, j*tw+tw)
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
    ctx.fillStyle = clanAttributes[altClans[0]].color
    ctx.fillRect(offsetWall, offsetCeiling, offsetWall + doorWidth, offsetCeiling + doorHeight)

    // right door
    ctx.fillStyle = clanAttributes[altClans[1]].color
    ctx.fillRect(canvasWidth-offsetWall-doorWidth, offsetCeiling, canvasWidth-offsetWall+doorWidth, offsetCeiling + doorHeight)
  }


  const drawRoom: StatefulDraw = (time, state): Draw => {
    return (ctx) => {
      drawTiles(time, ctx)
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
      return
    }


    if (state.drops.length > 0) {
      dropScene(time, state, illustrate)
    } else {
      swarmScene(time, state, illustrate)
    }
  }


  const swarmScene = (time, state, illustrate) => {
    // illustrate( drawRoom(time, state) )
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


  const applyToTree = <U extends UnitPosition>(tree: QTInterface, u: U): QTInterface => {
    tree.insert(u)
    return tree
  }


  function addOpeningElementsToTree(time, tree) {
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


  /* Global handler for store state updates */
  const updateTreeIndices = <T>(time, state: State, tree: T) => {
    if (state.level == 0) {
      return addOpeningElementsToTree(time, tree)
    }
    return ([state.player, ...state.drones, ...state.drops]).reduce(applyToTree,tree)
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


  const addToAssemblage = (assemblage: Assemblage, clan: Clan, role: Role, amt = 2): Assemblage => {
    const key = Role[role]
    if  (assemblage[key].clan != clan) {
      const preset = Presets[Clan[clan]]
      // Swap the previous type with the new one
      assemblage[key].clan = clan
      assemblage[key].strength = amt
      assemblage[key].bpm = preset.bpm
      assemblage[key].tonic = preset.tonic
      assemblage[key].melody = preset.voices[key]
    } else {
      assemblage[key].strength += amt
    }
    return assemblage
  }


  const handleTouches = (state, touches): State => {
    if (touches.length == 0)
      return state

    if (state.level == 0) {
      // first room is a bass shield pickup
      if (touches.length == 1) {
        const element = touches[0]
        const assemblage = addToAssemblage(state.assemblage, element.clan, Role.bass)
        return {...state, assemblage, level: 1}
      }
    }

    if (state.level > 0) {
      const drones = state.drones.filter(d =>!touches.includes(d))
      return drones.length > 0 
        ? {...state, drones}
        : {...state, drones, level: state.level + 1}
    }


    return state
  }


  const setupNextLevel = (state: State): State => {
    const room = nextRoom( state.room.clan, state.room.role )
    const drones = getDrones(state.level * 2)
    return {...state, drones, room}
  }


  const setupDrops = (state: State): State => {
    // const unit = createMusicDrop({x, y, width: radius, height: radius, clan: Clan[i]})
    const element = createMusicDrop(
      { name: 'element'
      , x: canvasWidth / 2
      , y: canvasHeight / 2
      , radius: (time, index = 1) => 1+ 40 * abs(sin((1+index)*tiny(time)))
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

    if ( next.drones.length == 0 && next.drops.length == 0 ) {
      next = setupDrops(next)
      return requestAnimationFrame((ntime) => loop(ntime, next, draw, tree))
    }

    updateListeners(next)
    drawStage(time, next, draw)
    requestAnimationFrame((ntime) => loop(ntime, next, draw, tree))
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

    const tree = new Quadtree({x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);

    tick(0, state, draw, tree)
  }


  const { abs, sin, cos, pow } = Math
  const tiny = (n, scale = 3) => n * pow(10,-(scale))
  const controls: Controls = []
  const state: State = 
    { player: createPlayer()
    , assemblage:
        { bass: <SoundSource>{ strength: 0 }
        , tenor: <SoundSource>{ strength: 0 }
        , alto: <SoundSource>{ strength: 0 }
        , soprano: <SoundSource>{ strength: 0 }
        }
    , drones: []
    , drops: 
      [ createMusicDrop({clan: Clan.Red, radius: (time, index = 1) => 1+ 40 * abs(sin((1+index)*tiny(time)))})
      , createMusicDrop({clan: Clan.Yellow, radius: (time, index = 2) => 1+ 40 * abs(sin((1+index)*tiny(time)))})
      , createMusicDrop({clan: Clan.Blue, radius: (time, index = 3) => 1+ 40 * abs(sin((1+index)*tiny(time)))})
      ]
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
        state.drops.forEach((unit, j) => {
          const x = offsetWall + (i*elWidth)
          const y = offsetCeiling // * ((Math.cos(time * (i*0.25)/100)))
          const radius = unit.radius(time,j)
          // apply these here so they are stored for next tree insertion
          unit.width = radius
          unit.height = radius

          ctx.fillStyle = ctx.strokeStyle = clanAttributes[i].color
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
        })
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
        ctx.fillStyle = ctx.strokeStyle = clanAttributes[i]
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


type Voice = 
  { bpm: number
  , dt: number
  , dv: number
  , tonic?: number
  , melody?: number[] // intervals
  , notes?: number[][] // [freq, duration] point in soundspace
  , sequencer?: any
  , next?: any
  }


type SoundSource = (Voice | null) & { strength: number, next?: typeof Sequence }

type Assemblage = 
  { bass: SoundSource
  , tenor: SoundSource
  , alto: SoundSource
  , soprano: SoundSource
  }


const Presets = 
  { [Clan.Yellow]: 
    { tonic: 80
    , bpm: 70
    , voices:
      { bass: [0, 3, 4, 5, 3, 5, 12, 7]
      , tenor: [0, 5, NaN, 5]
      , alto: [2, 2, NaN]
      , soprano: [7, 7, NaN, 9, 7, 7, 9, 13]
      }
    }
  , [Clan.Red]: 
    { tonic: 106.66
    , bpm: 93.333
    , voices: 
      { bass: [7, 0, 7, 7]
      , tenor: [3, 3, 2, 3, 5, 3, 2, 0]
      , alto: [NaN, 5, 3, 5]
      , soprano: [10, NaN, NaN, 10, 12, 11, 9, NaN]
      }
    }
  , [Clan.Blue]:
    { tonic: 142
    , bpm: 124.44
    , voices: 
      { bass: [12, 9, 8, 7, 9, 7, 0, 5]
      , tenor: [3, 3, 2, 3, 5, 3, 2, 0]
      , alto: [10, 10, NaN]
      , soprano: [10, NaN, NaN, 10, 12, 11, 9, NaN]
      }
    }
  }


  /**
the game state must be aware of current global baseline bpm and measure number
it does not need a record of it


  */






// todo decide if it is worth having a global async controls or use something else
game.controls = []
game()  