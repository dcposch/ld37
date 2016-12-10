var canvas = document.querySelector('canvas')
var regl = require('regl')(canvas)
var config = require('../config')

// All game state lives here
var state = {
  started: false
}

// Hello world spinning triangle from
// https://github.com/regl-project/regl
var drawTriangle = regl({
  frag: `
    precision mediump float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`,

  vert: `
    precision mediump float;
    attribute vec2 position; void main() {
      gl_Position = vec4(position, 0, 1);
    }`,

  // Here we define the vertex attributes for the above shader
  attributes: {
    // regl.buffer creates a new array buffer object
    position: regl.buffer([
      [-2, -2],   // no need to flatten nested arrays, regl automatically
      [4, -2],    // unrolls them into a typedarray (default Float32)
      [4,  4]
    ])
    // regl automatically infers sane defaults for the vertex attribute pointers
  },

  uniforms: {
    // This defines the color of the triangle to be a dynamic variable
    color: regl.prop('color')
  },

  // This tells regl the number of vertices to draw in this command
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
  drawTriangle({ color: [cos * cos, sin * sin, 1, 1] })
}

// For easier debugging
window.state = state
window.config = config
