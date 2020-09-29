// const title = `Bard Fantasy`

// const instructions = `
// Collect the fragments in each room to finish the Assembly
// Your nexts action is to complete all four parts of your Assemblage 
// `



// const playback: Setup = (state, tick, config) => {
//   const {canvasWidth, canvasHeight} = config
//   const canvas = document.createElement('canvas')
//   const ctx = <CanvasRenderingContext2D> canvas.getContext('2d')
//   document.body.appendChild(canvas)
  
//   const scene: Illustrate = (draw: Draw): SideFX  => {
//     ctx.beginPath()
//     draw(ctx)
//     ctx.closePath()
//   }

//   const tree = new Quadtree({x: 0, y: 0, width: canvasWidth, height: canvasHeight }, 3, 4);
//   tick(0, state, scene, tree)
// }
