var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures')

var CW = 2
var CD = 1
var CH = 1

module.exports = Couch

function Couch () {
  this.polys = makePolys()
  this.draw = compileDraw(this.polys)
}

Couch.prototype.intersect = function (x, y, z) {
  // TODO: loop thru polys, compute intersection
  return false
}

// Couch made of 8-vert polyhedra
function makePolys () {
  var polys = []
  var x, y, off

  // Pegs to stand on
  var PEGH = 0.1
  var PEGW = 0.05
  var PEG_CW = CW * 0.98 - PEGW
  var PEG_CD = CD * 0.98 - PEGW
  for (var i = 0; i < 4; i++) {
    x = i % 2 * PEG_CW - PEG_CW / 2
    y = (i >> 1) * PEG_CD - PEG_CD / 2
    off = PEGW / 2
    polys.push(makeAxisPoly(x - off, y - off, 0, x + off, y + off, PEGH))
  }

  // Base
  var BASEH = 0.35
  polys.push(makeAxisPoly(-CW / 2, -CD / 2, PEGH, CW / 2, CD / 2, BASEH))

  // Cushions
  var SEATH = 0.5
  var GAP = 0.02
  var SEATW = CW - 2 * GAP
  for (i = 0; i < 2; i++) {
    // Seat cushion
    polys.push(makeAxisPoly(-SEATW / 2, -CD / 2, BASEH + GAP, -GAP / 2, CD / 2, SEATH))
    polys.push(makeAxisPoly(GAP / 2, -CD / 2, BASEH + GAP, SEATW / 2, CD / 2, SEATH))
  }

  // Backrest
  var YFB = -CD * 0.25 // y coordinate of front, at the bottom
  var YBB = -CD * 0.5 // back, at the bottom
  var YFT = -CD * 0.45 // front, at the top
  var YBT = -CD * 0.6 // back, at the top
  var ZB = BASEH // z coordinate of the bottom
  var ZT = CH // top of backrest = height of couch
  polys.push([
    [-CW / 2, YBB, ZB],
    [-CW / 2, YBT, ZT],
    [-CW / 2, YFB, ZB],
    [-CW / 2, YFT, ZT],
    [CW / 2, YBB, ZB],
    [CW / 2, YBT, ZT],
    [CW / 2, YFB, ZB],
    [CW / 2, YFT, ZT]
  ])

  // Armrests
  for (i = 0; i < 2; i++) {
    var x0 = i === 0 ? -CW * 0.6 : CW * 0.5
    var x1 = i === 0 ? -CW * 0.5 : CW * 0.6
    var y0 = -CD * 0.5
    var y1 = CD * 0.5
    var z0 = SEATH
    var z1 = SEATH + CW * 0.1
    polys.push(makeAxisPoly(x0, y0, z0, x1, y1, z1))
  }

  return polys
}

function compileDraw (polys) {
  // Turn each polyhedron into six quads
  var verts = []
  var norms = []
  var uvs = []
  var face = [[0, 0], [0, 1], [1, 0], [1, 0], [0, 1], [1, 1]]
  polys.forEach(function (poly) {
    for (var i = 0; i < 6; i++) {
      // TODO: accurate normals?
      var nx = i >> 1 === 0 ? 1 - i % 2 * 2 : 0
      var ny = i >> 1 === 1 ? 1 - i % 2 * 2 : 0
      var nz = i >> 1 === 2 ? 1 - i % 2 * 2 : 0
      // ...each with two tris, six verts
      for (var j = 0; j < 6; j++) {
        var ix = i >> 1 === 0 ? i % 2 : face[j][0]
        var iy = i >> 1 === 1 ? i % 2 : face[j][i >> 2]
        var iz = i >> 1 === 2 ? i % 2 : face[j][1]
        var vert = poly[ix * 4 + iy * 2 + iz]
        verts.push(vert)
        norms.push([nx, ny, nz])
        // TODO: accurate UVs
        uvs.push(face[j])
      }
    }
  })

  return regl({
    frag: shaders.frag.texLight,
    vert: shaders.vert.uvWorld,
    attributes: {
      aVertexPosition: regl.buffer(verts),
      aVertexNormal: regl.buffer(norms),
      aVertexUV: regl.buffer(uvs)
    },
    uniforms: {
      uTexture: textures.room
    },
    count: verts.length
  })
}

function makeAxisPoly (x0, y0, z0, x1, y1, z1) {
  return [
    [x0, y0, z0],
    [x0, y0, z1],
    [x0, y1, z0],
    [x0, y1, z1],
    [x1, y0, z0],
    [x1, y0, z1],
    [x1, y1, z0],
    [x1, y1, z1]
  ]
}
