var config = require('../config')

module.exports = {
  tick: tick
}

var PW = config.PHYSICS.PLAYER_WIDTH
var PH = config.PHYSICS.PLAYER_HEIGHT

var EPS = 0.001
var HEAD_COLLISION_BUFFER = 0.15
var SPIDER_ATTACK_RANGE = 1.5

// Calculates player physics. Lets the player move and look around.
function tick (state, dt) {
  dt = Math.min(dt, 0.1)
  gameplay(state, dt)
  navigate(state, dt)
  simulate(state, dt)
  look(state.player, state.mouse)
}

// Check for user attacks
function gameplay (state, dt) {
  var player = state.player
  var loc = player.location
  var spiders = state.spiders

  if (state.actions['attack']) {
    state.flamethrower.shoot()
  }

  // Check each spider to see if player hit it, or it hit the player
  for (var i = 0; i < spiders.length; i++) {
    // Check if player hit spider
    var didHit = state.actions['attack'] && spiders[i].intersect(
      loc.x - SPIDER_ATTACK_RANGE,
      loc.x + SPIDER_ATTACK_RANGE,
      loc.y - SPIDER_ATTACK_RANGE,
      loc.y + SPIDER_ATTACK_RANGE,
      loc.z - PH,
      loc.z
    )

    if (didHit) {
      // Remove spider
      spiders.splice(i, 1)

      // Increment score
      state.player.score += 1

      // Continue the loop
      i -= 1
      continue
    }

    // Check if spider hit the player
    var wasHit = spiders[i].intersect(
      loc.x - PW * 2,
      loc.x + PW * 2,
      loc.y - PW * 2,
      loc.y + PW * 2,
      loc.z - PH,
      loc.z + PH
    )

    if (wasHit) {
      state.restartGame()
    }
  }
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

  if (!collide(state, newX, v.y, v.z - PH, v.z)) {
    v.x = newX
  }

  if (!collide(state, v.x, newY, v.z - PH, v.z)) {
    v.y = newY
  }

  if (!collide(state, v.x, v.y, newZ - PH, newZ)) {
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
  var underfoot = collide(state, loc.x, loc.y, newZ - PH)
  var head = collide(state, loc.x, loc.y, newZ + HEAD_COLLISION_BUFFER)
  if (head && underfoot) {
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

// Returns true if the player at (x, y, z0, z1) collides with any of the models
function collide (state, x, y, z0, z1) {
  if (z1 === undefined) {
    z1 = z0 + EPS
  }

  for (var i = 0; i < state.models.length; i++) {
    if (state.models[i].intersect(x - PW, x + PW, y - PW, y + PW, z0, z1)) return true
  }

  return false
}
