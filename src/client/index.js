var camera = require('./camera')
var config = require('../config')
var Couch = require('./models/couch')
var fullscreen = require('./fullscreen')
var playerControls = require('./player-controls')
var Room = require('./models/room')
var sound = require('./sound')
var {canvas, regl} = require('./env')

sound.preload()
sound.play('start', {
  playing: function () { setTimeout(function () { sound.startLevel(1) }, 5000) }
})

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
  lastFrameTime: null,
  models: []
}

// Listen to user input
document.addEventListener('keydown', function (e) {
  if (!document.pointerLockElement) canvas.requestPointerLock()
  var action = config.CONTROLS.KEY[e.key]
  if (action) state.actions[action] = true
})

document.addEventListener('keyup', function (e) {
  var action = config.CONTROLS.KEY[e.key]
  if (action) state.actions[action] = false
})

canvas.addEventListener('click', function (e) {
  if (!document.pointerLockElement) canvas.requestPointerLock()
  var action = config.CONTROLS.MOUSE[e.key]
  if (action) state.actions[action] = false
})

canvas.addEventListener('mousemove', function (e) {
  if (!document.pointerLockElement) return
  state.mouse.dx += e.movementX
  state.mouse.dy += e.movementY
})

document.addEventListener('visibilitychange', function () {
  if (document.hidden) state.actions = {}
})

// Canvas size and fullscreen
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

fullscreen.on('attain', function () {
  document.body.classList.add('fullscreen')
})

fullscreen.on('release', function () {
  document.body.classList.remove('fullscreen')
})

document.querySelector('#fullscreen').addEventListener('click', function (e) {
  fullscreen.requestFullscreen(document.body)
  if (!document.pointerLockElement) canvas.requestPointerLock()
})

// Create the world
state.models.push(new Room())
state.models.push(new Couch())
var scope = regl({
  uniforms: {
    uMatrix: camera.updateMatrix,
    uLightPos: [0, 0, config.WORLD.ROOM_HEIGHT - 0.2],
    uLightColor: [1, 0.9, 0.8]
  }
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

  // Draw the scene
  scope(state, function (context) {
    state.models.forEach(function (model) {
      model.draw(context)
    })
  })
}

function resizeCanvas () {
  canvas.width = document.body.clientWidth
  canvas.height = document.body.clientHeight
}

// For easier debugging
window.state = state
window.config = config
window.regl = regl
