var regl = require('./regl')
var shaders = require('./shaders')
var config = require('../config')

// All game state lives here
var state = {
  started: false
}

// Hello world spinning triangle from
// https://github.com/regl-project/regl
var drawTriangle = regl({
  frag: shaders.frag.color,
  vert: shaders.vert.colorClip,
  attributes: {
    aVertexPosition: regl.buffer([
      [-2, -2],
      [4, -2],
      [4,  4]
    ]),
    aVertexColor: regl.prop('colors')
  },
  count: 3
})

// Start the render loop
regl.frame(frame)

// Renders each frame. Should run at 60Hz.
// Stops running if the canvas is not visible, for example because the window is minimized.
function frame (context) {
  regl.clear({ color: [1, 1, 1, 1], depth: 1 })

  // Draw a triangle that changes colors
  var cos = Math.cos(context.time)
  var sin = Math.sin(context.time)
  drawTriangle({ colors: [
    [cos * cos, sin * sin, 0, 1],
    [cos * cos, sin * sin, 0.5, 1],
    [cos * cos, sin * sin, 1, 1]
  ]})
}

// For easier debugging
window.state = state
window.config = config
