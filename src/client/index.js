var {canvas, regl} = require('./env')
var shaders = require('./shaders')
var textures = require('./textures')
var config = require('../config')
var camera = require('./camera')
var playerControls = require('./player-controls')

// All game state lives here
var state = {
  player: {
    // Block coordinates of the player's head (the camera). +Z is up. When facing +X, +Y is left.
    location: { x: 0, y: 0, z: config.PHYSICS.PLAYER_HEIGHT },
    // Azimuth ranges from 0 (looking down the +X axis) to 2*pi. Azimuth pi/2 looks at +Y.
    // Altitude ranges from -pi/2 (looking straight down) to pi/2 (up). 0 looks straight ahead.
    direction: { azimuth: 0, altitude: 0 },
    // Physics
    dzdt: 0,
    // Situation can also be 'on-ground', 'suffocating'
    situation: 'airborne'
  },
  actions: {},
  mouse: {dx: 0, dy: 0},
  lastFrameTime: null
}

// Listen to user input
document.addEventListener('keydown', function (e) {
  var action = config.CONTROLS.KEY[e.key]
  if (action) state.actions[action] = true
})

document.addEventListener('keyup', function (e) {
  var action = config.CONTROLS.KEY[e.key]
  if (action) state.actions[action] = false
})

canvas.addEventListener('click', function (e) {
  if (!document.pointerLockElement) return canvas.requestPointerLock()
  var action = config.CONTROLS.MOUSE[e.key]
  if (action) state.actions[action] = false
})

canvas.addEventListener('mousemove', function (e) {
  if (!document.pointerLockElement) return
  state.mouse.dx += e.movementX
  state.mouse.dy += e.movementY
})

// Create a room with six faces
var verts = []
var norms = []
var uvs = []
var RW = config.WORLD.ROOM_WIDTH
var RH = config.WORLD.ROOM_HEIGHT
var face = [[0, 0], [0, 1], [1, 0], [1, 0], [0, 1], [1, 1]]
for (var i = 0; i < 6; i++) {
  var nx = i >> 1 === 0 ? 1 - i % 2 * 2 : 0
  var ny = i >> 1 === 1 ? 1 - i % 2 * 2 : 0
  var nz = i >> 1 === 2 ? 1 - i % 2 * 2 : 0
  // ...each with two tris, six verts
  for (var j = 0; j < 6; j++) {
    var x = (i >> 1 === 0 ? i % 2 : face[j][0]) * RW - RW / 2
    var y = (i >> 1 === 1 ? i % 2 : face[j][i >> 2]) * RW - RW / 2
    var z = (i >> 1 === 2 ? i % 2 : face[j][1]) * RH
    verts.push([x, y, z])
    norms.push([nx, ny, nz])
    uvs.push(face[j])
  }
}

var drawRoom = regl({
  frag: shaders.frag.texLight,
  vert: shaders.vert.uvWorld,
  attributes: {
    aVertexPosition: regl.buffer(verts),
    aVertexNormal: regl.buffer(norms),
    aVertexUV: regl.buffer(uvs)
  },
  uniforms: {
    uMatrix: camera.updateMatrix,
    uTexture: textures.room,
    uLightPos: [0, 0, RH - 0.2],
    uLightColor: [1, 0.9, 0.8]
  },
  count: verts.length
})

// Start the render loop
regl.frame(frame)

// Renders each frame. Should run at 60Hz.
// Stops running if the canvas is not visible, for example because the window is minimized.
function frame (context) {
  regl.clear({ color: [1, 1, 1, 1], depth: 1 })

  // Update
  if (state.lastFrameTime) playerControls.tick(state, context.time - state.lastFrameTime)
  state.lastFrameTime = context.time

  // Draw a room
  drawRoom(state)
}

// For easier debugging
window.state = state
window.config = config
window.regl = regl
