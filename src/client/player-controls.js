var config = require('../config')

module.exports = {
  tick: tick
}

var EPS = 0.001
var PW = config.PHYSICS.PLAYER_WIDTH
var PH = config.PHYSICS.PLAYER_HEIGHT
var HORIZONTAL_COLLISION_DIRS = [
  [PW, 0],
  [-PW, 0],
  [0, PW],
  [0, -PW]
]

var COLLIDE_PRECISION_ITERATIONS = 15

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
  if (state.actions['forward']) move(loc, dist, dir.azimuth, 0)
  if (state.actions['back']) move(loc, dist, dir.azimuth + Math.PI, 0)
  if (state.actions['left']) move(loc, dist, dir.azimuth + Math.PI * 0.5, 0)
  if (state.actions['right']) move(loc, dist, dir.azimuth + Math.PI * 1.5, 0)

  // Jumping only works if we're on the ground
  if (state.actions['jump'] && player.situation === 'on-ground') {
    player.dzdt = config.PHYSICS.SPEED_JUMP
    player.situation = 'airborne'
  }
}

// Modify vector {x, y, z} by adding a vector in spherical coordinates
function move (v, r, azimuth, altitude) {
  v.x += Math.cos(azimuth) * Math.cos(altitude) * r
  v.y += Math.sin(azimuth) * Math.cos(altitude) * r
  v.z += Math.sin(altitude) * r
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

  // Horizontal collision
  HORIZONTAL_COLLISION_DIRS.forEach(function (dir) {
    if (collide(state, loc.x + dir[0], loc.y + dir[1], loc.z - PH, loc.z)) {
      var multiplier = 1.0;

      for (var iter = 0; iter < COLLIDE_PRECISION_ITERATIONS; iter++) {
        if (collide(state, (loc.x - dir[0] * multiplier) + dir[0], (loc.y - dir[1] * multiplier) + dir[1], loc.z - PH, loc.z)) {
          loc.x -= dir[0] * multiplier;
          loc.y -= dir[1] * multiplier;
        }

        multiplier *= 0.5;
      }
    }
  })

  // Gravity
  player.dzdt -= config.PHYSICS.GRAVITY * dt

  // Vertical collision
  var underfoot = collide(state, loc.x, loc.y, loc.z - PH - EPS)
  var legs = collide(state, loc.x, loc.y, loc.z - PW - EPS)
  var head = collide(state, loc.x, loc.y, loc.z + PW - EPS)
  if (head && underfoot) {
    player.dzdt = 0
    player.situation = 'suffocating'
  } else if (head) {
    player.dzdt = 0
    player.situation = 'airborne'
    loc.z -= BUMP_SPEED * dt
  } else if (legs) {
    player.dzdt = 0
    player.situation = 'on-ground'
    loc.z += BUMP_SPEED * dt
  } else if (underfoot && player.dzdt <= 0) {
    player.dzdt = 0
    player.situation = 'on-ground'
  } else {
    player.situation = 'airborne'
  }

  loc.z += player.dzdt * dt
}

// Returns true if the line segment (x, y, z0, z1) collides with any of the models
function collide (state, x, y, z0, z1) {
  for (var i = 0; i < state.models.length; i++) {
    if (state.models[i].intersect(x, y, z0, z1)) return true
  }
  return false
}
