var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures')
var Poly8 = require('../geometry/poly8')
var Mesh = require('../geometry/mesh')
var mat4 = require('gl-mat4')

module.exports = Spider

var meshTemplate = makeMesh()
var bufferUVs = regl.buffer(meshTemplate.uvs) // same for all spiders
var mat = mat4.create() // matrix to translate, rotate, and scale each model

function Spider () {
  this.location = {x: 2, y: 2, z: 0}
  this.direction = {azimuth: 0, altitude: 0}
  this.mesh = meshTemplate.copy()
  // Allocate buffers once, update the contents each frame
  // Usage stream lets WebGL know we'll be updating the buffers often.
  this.buffers = {
    verts: regl.buffer({usage: 'stream', data: this.mesh.verts}),
    norms: regl.buffer({usage: 'stream', data: this.mesh.norms})
  }
}

Spider.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  return false
}

Spider.prototype.draw = function () {
  var loc = this.location
  var dir = this.direction

  // Update the mesh
  var scale = 0.01
  mat4.identity(mat)
  mat4.rotateX(mat, mat, dir.azimuth)
  mat4.rotateZ(mat, mat, dir.altitude)
  mat4.translate(mat, mat, [-loc.x, -loc.y, -loc.z])
  mat4.scale(mat, mat, [scale, scale, scale])
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
  add(polys, 6, -4, 0, 8, 8, 8) // head
  add(polys, 0, -3, 1, 6, 6, 6) // neck
  add(polys, -12, -5, 0, 12, 10, 8) // body
  return polys
}

// Add a cuboid by x, y, z, width, depth, and height
function add (polys, x, y, z, w, d, h) {
  polys.push(Poly8.axisAligned(x, y, z, x + w, y + d, z + h))
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