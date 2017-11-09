var camera = require('./camera')
var config = require('./config')
var fullscreen = require('./fullscreen')
var playerControls = require('./player-controls')
var sound = require('./sound')
var {canvas, regl} = require('./env')
var coordinates = require('./geometry/coordinates')
var textures = require('./textures')

var Couch
var Room
var TV
var Spider
var Flamethrower

textures.load(init)

function init (err) {
  if (err) return console.error(err)

  console.log('HEY')
  Couch = require('./models/couch')
  Room = require('./models/room')
  TV = require('./models/tv')
  Spider = require('./models/spider')
  Flamethrower = require('./models/flamethrower')

  sound.preload()
  sound.play('start')

  // All game state lives here
  var state = {
    player: {
      // Block coordinates of the player's head (the camera). +Z is up. When facing +X, +Y is left.
      location: { x: 0, y: 2, z: config.PHYSICS.PLAYER_HEIGHT },
      // Azimuth ranges from 0 (looking down the +X axis) to 2*pi. Azimuth pi/2 looks at +Y.
      // Altitude ranges from -pi/2 (looking straight down) to pi/2 (up). 0 looks straight ahead.
      direction: { azimuth: Math.PI / 2, altitude: -Math.PI / 8 },
      // Physics
      dzdt: 0,
      // Situation can also be 'on-ground', 'suffocating'
      situation: 'airborne',
      score: 0,
      alive: true
    },
    actions: {},
    mouse: {dx: 0, dy: 0},
    lastFrameTime: null,
    models: [],
    spiders: [new Spider()],
    flamethrower: new Flamethrower(),
    restartGame: restartGame // RESTARTS THE GAME
  }
  createModels()

  function restartGame () {
    document.body.classList.remove('dead')
    state.player = {
      // Block coordinates of the player's head (the camera). +Z is up. When facing +X, +Y is left.
      location: { x: 0, y: 2, z: config.PHYSICS.PLAYER_HEIGHT },
      // Azimuth ranges from 0 (looking down the +X axis) to 2*pi. Azimuth pi/2 looks at +Y.
      // Altitude ranges from -pi/2 (looking straight down) to pi/2 (up). 0 looks straight ahead.
      direction: { azimuth: Math.PI / 2, altitude: -Math.PI / 8 },
      // Physics
      dzdt: 0,
      // Situation can also be 'on-ground', 'suffocating'
      situation: 'airborne',
      score: 0,
      alive: true
    }
    state.models = []
    createModels()
    state.actions = {}
    state.spiders = [new Spider()]
  }

  function createModels () {
    // Create the world
    state.models.push(new Room())
    state.models.push(new Couch())
    state.models.push(new TV())
  }

  // Listen to user input
  document.addEventListener('keydown', function (e) {
    if (e.metaKey) return
    if (!document.pointerLockElement) canvas.requestPointerLock()
    var action = config.CONTROLS.KEY[e.key]
    if (action) state.actions[action] = true
    e.preventDefault()
  })

  document.addEventListener('keyup', function (e) {
    var action = config.CONTROLS.KEY[e.key]
    if (action) state.actions[action] = false
    e.preventDefault()
  })

  canvas.addEventListener('click', function (e) {
    if (!document.pointerLockElement) canvas.requestPointerLock()
  })

  canvas.addEventListener('mousedown', function (e) {
    var action = config.CONTROLS.MOUSE[e.which]
    if (action) state.actions[action] = true
  })
  canvas.addEventListener('mouseup', function (e) {
    var action = config.CONTROLS.MOUSE[e.which]
    if (action) state.actions[action] = false
  })

  canvas.addEventListener('mousemove', function (e) {
    if (!document.pointerLockElement) return
    console.log('movementX:', e.movementX, 'movementY:', e.movementY)
    state.mouse.dx += e.movementX
    state.mouse.dy += e.movementY
  })

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) return
    for (var action in state.actions) {
      state.actions[action] = false
    }
  })

  // Canvas size, fullscreen, pointer lock
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

  var scope = regl({
    uniforms: {
      uMatrix: camera.updateMatrix,
      uLightPos: [0, 0, config.WORLD.ROOM_HEIGHT - 0.2],
      uLightColor: [1, 0.8, 0.7],
      uNumSpiders: regl.prop('spiders.length')
    }
  })

  // Start the render loop
  regl.frame(frame)

  // Renders each frame. Should run at 60Hz.
  // Stops running if the canvas is not visible, for example because the window is minimized.
  function frame (context) {
    if (state.player.alive) {
      regl.clear({ color: [0.1, 0.1, 0.4, 1], depth: 1 }) // it's dusk outside
    } else {
      regl.clear({ color: [1, 0.1, 0.2, 1], depth: 1 })
    }

    // Measure frame time. Should be 1/60th of a second (60FPS)
    var MIN_DT = 0.01 // bad things happen if dt is <=0
    var MAX_DT = 0.1 // bad things happen if player tabs away, then comes back and dt is many seconds
    var lastt = state.lastFrameTime
    var dt = lastt ? Math.min(MAX_DT, Math.max(MIN_DT, context.time - lastt)) : MIN_DT

    // Take input from the player, move, look around
    playerControls.tick(state, dt)

    // Swarm the spiders, and occasionally spawn a new one
    if (state.player.alive) state.spiders.forEach(function (spider) { spider.tick(dt) })
    if (Math.random() < (state.player.score ? 0.0075 + (state.player.score * 0.00025) : 0)) {
      state.spiders.push(new Spider(
        0.01 + (Math.random() * state.player.score * (state.player.score < 15 ? 0.0001 : state.player.score < 60 ? 0.0002 : 0.0003)),
        state.player.score > 10 && Math.random() < 0.4
      ))
    }

    // Simulate the flamethrower and flames
    var loc = state.player.location
    var dir = state.player.direction
    var right = coordinates.toCartesian(dir.azimuth - Math.PI / 2, 0, 0.20)
    state.flamethrower.location = {
      x: loc.x + right[0],
      y: loc.y + right[1],
      z: loc.z - 0.30 // flamethrower starts below and to the right of the camera
    }
    state.flamethrower.direction = {
      azimuth: dir.azimuth + 0.1, // point slightly left, FPS style
      altitude: Math.min(1.2, Math.max(-1.2, dir.altitude)) // don't let them flame themselves
    }
    state.flamethrower.tick(dt)

    // Sounds
    sound.tick(state)

    // Visuals
    scope(state, function (context) {
      state.models.forEach(function (model) {
        model.draw(context)
      })
      state.spiders.forEach(function (spider) {
        spider.draw(context)
      })
      state.flamethrower.draw(context)
    })

    state.lastFrameTime = context.time
  }

  function resizeCanvas () {
    canvas.width = document.body.clientWidth
    canvas.height = document.body.clientHeight
  }

  // For easier debugging
  window.state = state
  window.config = config
  window.regl = regl
}
