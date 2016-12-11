var config = require('../config')

module.exports = {
  tick: tick
}

var PW = config.PHYSICS.PLAYER_WIDTH
var PH = config.PHYSICS.PLAYER_HEIGHT
var HORIZONTAL_COLLISION_DIRS = [
  [PW, 0],
  [-PW, 0],
  [0, PW],
  [0, -PW]
]

var EPS = 0.001
var HEAD_COLLISION_BUFFER = 0.1

// Calculates player physics. Lets the player move and look around.
function tick (state, dt) {
  navigate(state, dt)
  simulate(state, dt)
  look(state.player, state.mouse)
}

// Let the player move
function navigate (state, dt) {
  var player = state.player
  var loc = player.location
  var dir = player.direction

  // Directional input (WASD) always works
  var dist = config.PHYSICS.SPEED_WALK * dt
  if (state.actions['forward']) move(state, loc, dist, dir.azimuth, 0)
  if (state.actions['back']) move(state, loc, dist, dir.azimuth + Math.PI, 0)
  if (state.actions['left']) move(state, loc, dist, dir.azimuth + Math.PI * 0.5, 0)
  if (state.actions['right']) move(state, loc, dist, dir.azimuth + Math.PI * 1.5, 0)

  // Jumping only works if we're on the ground
  if (state.actions['jump'] && player.situation === 'on-ground') {
    player.dzdt = config.PHYSICS.SPEED_JUMP
    player.situation = 'airborne'
  }
}

// Modify vector {x, y, z} by adding a vector in spherical coordinates
function move (state, v, r, azimuth, altitude) {
  var newX = v.x + Math.cos(azimuth) * Math.cos(altitude) * r
  var newY = v.y + Math.sin(azimuth) * Math.cos(altitude) * r
  var newZ = v.z + Math.sin(altitude) * r

  if (!playerCollide(state, newX, newY, newZ - PH, newZ)) {
    v.x = newX
    v.y = newY
    v.z = newZ
  }
}

// Let the player look around
function look (player, mouse) {
  var dir = player.direction
  var pi = Math.PI
  dir.azimuth -= mouse.dx * config.CONTROLS.MOUSE_SENSITIVITY
  dir.azimuth = (dir.azimuth + 2 * pi) % (2 * pi) // Wrap to [0, 2pi)
  dir.altitude -= mouse.dy * config.CONTROLS.MOUSE_SENSITIVITY
  dir.altitude = Math.min(0.5 * pi, Math.max(-0.5 * pi, dir.altitude)) // Clamp to [-pi/2, pi/2]
  mouse.dx = 0
  mouse.dy = 0
}

// Apply gravity to the player, collide with objects
function simulate (state, dt) {
  var player = state.player
  var loc = player.location

  // Gravity
  player.dzdt -= config.PHYSICS.GRAVITY * dt
  var newZ = loc.z + player.dzdt * dt

  // Vertical collision
  var underfoot = playerCollide(state, loc.x, loc.y, newZ - PH)
  var head = playerCollide(state, loc.x, loc.y, newZ + HEAD_COLLISION_BUFFER)
  if (head && underfoot) {
    loc.z = newZ
    player.dzdt = 0
    player.situation = 'suffocating'
  } else if (head) {
    player.dzdt = Math.min(player.dzdt, 0)
    player.situation = 'airborne'
  } else if (underfoot) {
    player.dzdt = Math.max(player.dzdt, 0)
    player.situation = 'on-ground'
  } else {
    loc.z = newZ
    player.situation = 'airborne'
  }
}

function playerCollide (state, x, y, z0, z1) {
  return HORIZONTAL_COLLISION_DIRS.some(function (dir) {
    return collide(state, x + dir[0], y + dir[1], z0, z1)
  })
}

// Returns true if the line segment (x, y, z0, z1) collides with any of the models
function collide (state, x, y, z0, z1) {
  if (z1 === undefined) {
    z1 = z0 + EPS
  }

  for (var i = 0; i < state.models.length; i++) {
    if (state.models[i].intersect(x, y, z0, z1)) return true
  }

  return false
}
