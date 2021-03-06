var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures').textures
var config = require('../config')
var Poly8 = require('../geometry/poly8')
var Mesh = require('../geometry/mesh')
var makeUVs = require('../geometry/uv')
var coordinates = require('../geometry/coordinates')
var vec2 = require('gl-vec2')
var vec3 = require('gl-vec3')
var mat4 = require('gl-mat4')

module.exports = Flamethrower

var RW = config.WORLD.ROOM_WIDTH
var RH = config.WORLD.ROOM_HEIGHT

// Barrel length and width
var BL = 4
var BW = 1

// Nozzle length and width
var NL = 2
var NW = 2

var MAX_FIRES = 100

// Temps in Kelvin. Flames go from white to red, then disappear
var TEMP_INITIAL = 6000
var TEMP_MIN = 500

// Fire animation
var ANIM_NUM_FRAMES = 8
var ANIM_FPS = 8

var SCALE_GUN = 0.1
var SCALE_FIRE_MIN = 0.15
var SCALE_FIRE_MAX = 0.4

// TODO: switch to indexed triangles
var FACE = [[0, 0], [0, 1], [1, 0], [1, 0], [0, 1], [1, 1]]

// Allocate once and reuse
var meshes = {
  gunTemplate: makeGunMesh(),
  gun: makeGunMesh(),
  fireTemplate: Poly8.axisAligned(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5).createMesh(),
  fire: Poly8.axisAligned(0, 0, 0, 0, 0, 0).createMesh(),
  fires: makeMultiFireMesh()
}

// Compile regl commands
var drawGun = regl({
  frag: shaders.frag.texLight,
  vert: shaders.vert.uvWorld,
  attributes: {
    aPosition: function (ctx, props) { return props.aPosition },
    aNormal: function (ctx, props) { return props.aNormal },
    aUV: function (ctx, props) { return props.aUV }
  },
  uniforms: {
    uTexture: textures.metal
  },
  count: meshes.gun.verts.length
})

var drawFire = regl({
  frag: shaders.frag.texLight,
  vert: shaders.vert.uvWorld,
  attributes: {
    aPosition: function (ctx, props) { return props.aPosition },
    aNormal: function (ctx, props) { return props.aNormal },
    aUV: function (ctx, props) { return props.aUV }
  },
  uniforms: {
    uTexture: textures.fire
  },
  count: MAX_FIRES * 36
})

function Flamethrower () {
  // Logic
  this.location = {x: 0, y: 0, z: 0}
  this.direction = {azimuth: 0, altitude: 0}
  this.fires = []

  // Rendering
  this.gunAttributes = makeAttributes(meshes.gun)
  this.fireAttributes = makeAttributes(meshes.fires)
  this.fireAttributes.aFireAnim = regl.buffer({length: MAX_FIRES * 2 * 36 * 4, type: 'float32'})
}

Flamethrower.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  return false
}

// Shoots a single fire. Call up to once per frame or so to shoot lots of fire.
Flamethrower.prototype.shoot = function () {
  var loc = this.location
  var dir = this.direction

  // Fire comes from the front of the cannon.
  var fireVel = coordinates.toCartesian(dir.azimuth, dir.altitude, 1)
  var fireLoc = vec3.clone([loc.x, loc.y, loc.z])
  vec3.scaleAndAdd(fireLoc, fireLoc, fireVel, 0.4)

  // Spray. Randomize the direction a bit.
  var fireAzith = dir.azimuth + (Math.random() - 0.5) * 0.3
  var fireAlt = dir.altitude + (Math.random() - 0.5) * 0.2
  fireVel = coordinates.toCartesian(fireAzith, fireAlt, 10)
  this.fires.push(new Fire(fireLoc, fireVel))

  if (this.fires.length > MAX_FIRES) this.fires.shift()
}

Flamethrower.prototype.tick = function (dt) {
  var fires = this.fires
  var offset = 0
  for (var i = 0; i < fires.length; i++) {
    fires[i].tick(dt)
    if (offset > 0) fires[i - offset] = fires[i]
    if (fires[i].temp < TEMP_MIN) offset++
  }
  if (offset > 0) fires.length -= offset
}

Flamethrower.prototype.draw = function (context) {
  var loc = this.location
  var dir = this.direction
  var now = new Date().getTime()

  // Update gun
  var mat = mat4.create()
  mat4.translate(mat, mat, [loc.x, loc.y, loc.z])
  mat4.rotateZ(mat, mat, dir.azimuth)
  mat4.rotateY(mat, mat, -dir.altitude)
  mat4.scale(mat, mat, [SCALE_GUN, SCALE_GUN, SCALE_GUN])
  Mesh.transform(meshes.gun, meshes.gunTemplate, mat)

  this.gunAttributes.aPosition.subdata(meshes.gun.verts)
  this.gunAttributes.aNormal.subdata(meshes.gun.norms)

  // Update fire
  for (var i = 0; i < this.fires.length; i++) {
    var fire = this.fires[i]

    // Transform verts
    var scalet = Math.min(0, (now - fire.startTime) / 5000)
    var scale = (1 - scalet) * SCALE_FIRE_MIN + scalet * SCALE_FIRE_MAX
    mat4.identity(mat)
    mat4.translate(mat, mat, fire.location)
    mat4.rotateX(mat, mat, fire.rotation[0])
    mat4.rotateY(mat, mat, fire.rotation[1])
    mat4.rotateZ(mat, mat, fire.rotation[2])
    mat4.scale(mat, mat, [scale, scale, scale])
    Mesh.transform(meshes.fire, meshes.fireTemplate, mat)

    // Animation frame, update UVs
    var frame = Math.floor((context.time - fire.animStartTime) * ANIM_FPS) % ANIM_NUM_FRAMES
    var v0 = frame / ANIM_NUM_FRAMES
    var v1 = (frame + 1) / ANIM_NUM_FRAMES

    // Update buffers
    for (var j = 0; j < 36; j++) {
      vec3.copy(meshes.fires.verts[i * 36 + j], meshes.fire.verts[j])
      var f = FACE[j % 6]
      vec2.copy(meshes.fires.uvs[i * 36 + j], [f[0], f[1] ? v1 : v0])
    }
  }

  for (i = this.fires.length * 36; i < MAX_FIRES * 36; i++) {
    vec3.set(meshes.fires.verts[i], 0, 0, 0)
  }

  this.fireAttributes.aPosition.subdata(meshes.fires.verts)
  this.fireAttributes.aUV.subdata(meshes.fires.uvs)

  drawGun(this.gunAttributes)
  drawFire(this.fireAttributes)
}

function Fire (location, velocity) {
  this.location = location
  this.velocity = velocity
  this.rotation = vec3.create()
  this.angularv = vec3.create()
  this.temp = TEMP_INITIAL
  this.startTime = new Date().getTime()
  this.animStartTime = -Math.random() * 5
}

Fire.prototype.tick = function (dt) {
  var loc = this.location
  var vel = this.velocity
  vec3.scaleAndAdd(loc, loc, vel, dt)

  // TODO: bounce off of other things like the couch?
  // we'll need an intersect() function that returns a normal, not just true/false
  var bounce = 0.2
  var bounced = true
  if (loc[0] < -RW / 2 && vel[0] < 0) vel[0] = -vel[0] * bounce
  else if (loc[0] > RW / 2 && vel[0] > 0) vel[0] = -vel[0] * bounce
  else if (loc[1] < -RW / 2 && vel[1] < 0) vel[1] = -vel[1] * bounce
  else if (loc[1] > RW / 2 && vel[1] > 0) vel[1] = -vel[1] * bounce
  else if (loc[2] < 0 && vel[2] < 0) vel[2] = -vel[2] * bounce
  else if (loc[2] > RH && vel[2] > 0) vel[2] = -vel[2] * bounce
  else bounced = false

  // Rotate
  if (bounced) vec3.set(this.angularv, Math.random(), Math.random(), Math.random())
  vec3.scaleAndAdd(this.rotation, this.rotation, this.angularv, dt)

  // Gravity and floatiness
  var float = this.temp / 6000 * 15 // 6000 kelvin: float upward, cooler: start falling
  vel[2] += dt * (float - config.PHYSICS.GRAVITY)

  // Random swerve
  var swerve = 0.05
  vel[0] += (Math.random() - 0.5) * swerve
  vel[1] += (Math.random() - 0.5) * swerve
  vel[2] += (Math.random() - 0.5) * swerve

  // Cooling
  this.temp *= Math.exp(-dt * 2)
}

function makeGunMesh () {
  // Straight ahead with {azimuth : 0} points toward +X
  var polys = []
  var s = SCALE_GUN
  var uvsBarrel = makeUVs(BL * s, BW * s, BW * s, 32, 32)
  var uvsNozzle = makeUVs(NL * s, NW * s, NW * s, 32, 32)
  polys.push(Poly8.axisAligned(0, -BW / 2, -BW / 2, BL, BW / 2, BW / 2, uvsBarrel))
  polys.push(Poly8.axisAligned(BL, -NW / 2, -NW / 2, BL + NL, NW / 2, NW / 2, uvsNozzle))

  return Mesh.combine(polys.map(function (poly) {
    return poly.createMesh()
  }))
}

function makeMultiFireMesh () {
  var polys = []
  var empty = Poly8.axisAligned(0, 0, 0, 0, 0, 0)
  for (var i = 0; i < MAX_FIRES; i++) polys.push(empty)

  return Mesh.combine(polys.map(function (poly) {
    return poly.createMesh()
  }))
}

function makeAttributes (mesh) {
  return {
    aPosition: regl.buffer(mesh.verts),
    aNormal: regl.buffer(mesh.norms),
    aUV: regl.buffer(mesh.uvs)
  }
}
