module.exports = Poly8

// Represents an 8-point polyhedron
function Poly8 (verts, uvs) {
  validate(verts, 3)
  if (uvs) validate(uvs, 2)

  this.verts = verts
  this.uvs = uvs
  this.aabb = computeAABB(verts)
}

// Tests for intersection
Poly8.prototype.intersect = function (x, y, z) {
  var b = this.aabb // axis aligned bounding box
  return x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1 && z > b.z0 && z < b.z1
}

// Creates an axis-aligned cuboid from p0 to p1
Poly8.axisAligned = function (x0, y0, z0, x1, y1, z1) {
  return new Poly8([
    [x0, y0, z0],
    [x0, y0, z1],
    [x0, y1, z0],
    [x0, y1, z1],
    [x1, y0, z0],
    [x1, y0, z1],
    [x1, y1, z0],
    [x1, y1, z1]
  ])
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

function validate (points, dim) {
  if (points.length !== 8) {
    throw new Error('expected 8 points')
  }
  points.forEach(function (point) {
    if (point.length !== dim) {
      throw new Error('expected ' + dim + ' coords per point')
    }
    point.forEach(function (v) {
      if (!(v > -Infinity && v < Infinity)) {
        throw new Error('point not finite: ' + point.join(', '))
      }
    })
  })
}
