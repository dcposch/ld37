var validate = require('./validate')
var Mesh = require('./mesh')

module.exports = Poly8

// Represents an 8-point polyhedron
function Poly8 (verts, uvs) {
  validate(verts, 3, 8)
  if (uvs) validate(uvs, 4, 6)

  this.verts = verts
  this.uvs = uvs
  this.aabb = computeAABB(verts)
}

// Tests for intersection with a line segment
Poly8.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  var b = this.aabb // axis aligned bounding box
  return Math.max(x0, b.x0) <= Math.min(x1, b.x1) &&
         Math.max(y0, b.y0) <= Math.min(y1, b.y1) &&
         Math.max(z0, b.z0) <= Math.min(z1, b.z1)
}

// Each face consists of two triangles
var FACE = [[0, 0], [0, 1], [1, 0], [1, 0], [0, 1], [1, 1]]

// Creates a mesh with six quads, two triangles each, like the six faces of a cube
Poly8.prototype.createMesh = function () {
  var mesh = new Mesh()
  var {verts, norms, uvs} = mesh

  // Create six faces...
  for (var i = 0; i < 6; i++) {
    // TODO: accurate normals? probably unnecessary unless we add specular lights
    var nx = i >> 1 === 0 ? 1 - i % 2 * 2 : 0
    var ny = i >> 1 === 1 ? 1 - i % 2 * 2 : 0
    var nz = i >> 1 === 2 ? 1 - i % 2 * 2 : 0
    var faceUVs = this.uvs ? this.uvs[i] : null

    // ...each with two tris, six verts
    for (var j = 0; j < 6; j++) {
      var vi = FACE[j] // `vi` is one of [0, 0], [0, 1], [1, 0], or [1, 1]

      var ix = i >> 1 === 0 ? i % 2 : vi[0]
      var iy = i >> 1 === 1 ? i % 2 : vi[i >> 2]
      var iz = i >> 1 === 2 ? i % 2 : vi[1]
      var vert = this.verts[ix * 4 + iy * 2 + iz]
      verts.push(vert)

      norms.push([nx, ny, nz])

      var uv = faceUVs ? [faceUVs[vi[0] * 2], faceUVs[vi[1] * 2 + 1]] : vi
      uvs.push(uv)
    }
  }

  return mesh
}

// Creates an axis-aligned cuboid from p0 to p1
// Optionally takes a list of 6 texture UVs arrays for the six faces (x0, x1, y0, y1, z0, z1)
Poly8.axisAligned = function (x0, y0, z0, x1, y1, z1, uvs) {
  return new Poly8([
    [x0, y0, z0],
    [x0, y0, z1],
    [x0, y1, z0],
    [x0, y1, z1],
    [x1, y0, z0],
    [x1, y0, z1],
    [x1, y1, z0],
    [x1, y1, z1]
  ], uvs)
}

// Finds the axis-aligned bounding box of a set of vertices
function computeAABB (verts) {
  var aabb = {
    x0: Infinity,
    y0: Infinity,
    z0: Infinity,
    x1: -Infinity,
    y1: -Infinity,
    z1: -Infinity
  }
  verts.forEach(function (v) {
    aabb.x0 = Math.min(aabb.x0, v[0])
    aabb.y0 = Math.min(aabb.y0, v[1])
    aabb.z0 = Math.min(aabb.z0, v[2])
    aabb.x1 = Math.max(aabb.x1, v[0])
    aabb.y1 = Math.max(aabb.y1, v[1])
    aabb.z1 = Math.max(aabb.z1, v[2])
  })
  return aabb
}
