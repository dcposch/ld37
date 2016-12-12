var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures')
var Poly8 = require('../geometry/poly8')
var Mesh = require('../geometry/mesh')
var config = require('../../config')
var mat4 = require('gl-mat4')

module.exports = Spider

var meshTemplate = makeMesh()
var bufferUVs = regl.buffer(meshTemplate.uvs) // same for all spiders
var mat = mat4.create() // matrix to translate, rotate, and scale each model

var SCALE_RADIUS = 10

function Spider (scale) {
  this.scale = scale || 0.01
  this.location = {x: 0, y: 0, z: 0}
  // Azimuth 0 points in the +Y direction.
  // Altitude 0 points straight ahead. +PI/2 points up at the sky (+Z). -PI/2 points down.
  this.direction = {
    azimuth: Math.random() * 2 * Math.PI,
    altitude: Math.random() < 0.2 ? 0.5 : 0
  }
  this.mesh = meshTemplate.copy()
  // Allocate buffers once, update the contents each frame
  // Usage stream lets WebGL know we'll be updating the buffers often.
  this.buffers = {
    verts: regl.buffer({usage: 'stream', data: this.mesh.verts}),
    norms: regl.buffer({usage: 'stream', data: this.mesh.norms})
  }
}

Spider.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  var loc = this.location
  var radius = SCALE_RADIUS * this.scale
  var poly = Poly8.axisAligned(loc.x - radius, loc.y - radius, loc.z - radius, loc.x + radius, loc.y + radius, loc.z + radius)
  return poly.intersect(x0, x1, y0, y1, z0, z1)
}

// Spider logic
Spider.prototype.tick = function (dt) {
  var loc = this.location
  var dir = this.direction

  // Change direction randomly
  var speed = 1
  if (dir.altitude > 0) {
    dir.altitude -= 0.005 // slowly lower head down
    speed = dir.altitude > 0.5 ? 0 : 1.5
  } else if (Math.random() < 0.002) {
    dir.altitude += 1 // pop head up
  } else {
    dir.azimuth += (Math.random() - 0.5) * 0.2 // scamper around
  }

  // Move forward
  loc.x += Math.cos(dir.azimuth) * speed * dt
  loc.y += Math.sin(dir.azimuth) * speed * dt

  // If we hit a wall, turn away
  var rw = config.WORLD.ROOM_WIDTH - 0.3
  var rand = (Math.random() - 0.5) * Math.PI
  if (loc.x > rw / 2) dir.azimuth = Math.PI + rand // go in the -X direction ish
  else if (loc.x < -rw / 2) dir.azimuth = rand // +X
  else if (loc.y > rw / 2) dir.azimuth = Math.PI * 1.5 + rand // -Y
  else if (loc.y < -rw / 2) dir.azimuth = Math.PI * 0.5 + rand // +Y
}

Spider.prototype.draw = function () {
  var loc = this.location
  var dir = this.direction

  // Update the mesh
  mat4.identity(mat)
  mat4.translate(mat, mat, [loc.x, loc.y, loc.z])
  mat4.rotateZ(mat, mat, dir.azimuth - Math.PI / 2)
  mat4.rotateX(mat, mat, dir.altitude)
  mat4.scale(mat, mat, [this.scale, this.scale, this.scale])
  Mesh.transform(this.mesh, meshTemplate, mat)

  // Update buffers
  this.buffers.verts.subdata(this.mesh.verts)
  this.buffers.norms.subdata(this.mesh.norms)

  Spider.draw({spider: this})
}

Spider.prototype.destroy = function () {
  this.buffers.verts.destroy()
  this.buffers.norms.destroy()
}

Spider.draw = regl({
  frag: shaders.frag.texLight,
  vert: shaders.vert.uvWorld,
  attributes: {
    aVertexPosition: function (context, props) { return props.spider.buffers.verts },
    aVertexNormal: function (context, props) { return props.spider.buffers.norms },
    aVertexUV: bufferUVs
  },
  uniforms: {
    uTexture: textures.spider
  },
  count: meshTemplate.verts.length
})

function makeMesh () {
  var polys = makePolys()
  return Mesh.combine(polys.map(function (poly) {
    return poly.createMesh()
  }))
}

function makePolys () {
  var polys = []
  add(polys, -4, 6, 0, 8, 8, 8, 32, 4) // head
  add(polys, -3, 0, 1, 6, 6, 6, 0, 0) // neck
  add(polys, -6, -10, 0, 12, 10, 8, 0, 18) // body
  return polys
}

// Add a cuboid by x, y, z, width, depth, and height, and integer UV
// Follows the Minecraft texture format. See
// http://papercraft.robhack.com/various_finds/Mine/texture_templates/mob/spider.png
function add (polys, x, y, z, w, d, h, u, v) {
  // w eg 12
  // d eg 10
  // h eg 8
  var makeUV = function (iu, iv, iw, ih) {
    return [iu / 64, iv / 32, (iu + iw) / 64, (iv + ih) / 32]
  }
  var uvs = [
    makeUV(u + w + d, v + w + h, w, -h), // x0 face: left
    makeUV(u, v + w + h, w, -h), // x1 face: right
    makeUV(u + 2 * w + d, v + w + h, d, -h), // y0 face: back
    makeUV(u + w, v + w + h, d, -h), // y1 face: front
    makeUV(u + w + d, v, d, w), // z0 face: bottom
    makeUV(u + w, v, d, w) // z1 face: top
  ]

  polys.push(Poly8.axisAligned(x, y, z, x + w, y + d, z + h, uvs))
}

// TODO: textured spider model? might not be necessary
// var head = new Part([32, 4], [-4, -4, -8], [8, 8, 8], [0, 15, -3]);
// var neck = new Part([0, 0], [-3, -3, -3], [6, 6, 6], [0, 15, 0]);
// var body = new Part([0, 12], [-5, -4, -6], [10, 8, 12], [0, 15, 9]);
// var leg = new Part([18, 0], [-15, -1, -1], [16, 2, 2], [-4, 15, 2]);
// function Part (uv, offset, dims, rotationPoint) {
//   this.uv = uv
//   this.offset = offset
//   this.dims = dims
//   this.rotationPoint = rotationPoint
// }
