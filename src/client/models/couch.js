var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures')
var Poly8 = require('../geometry/poly8')
var Mesh = require('../geometry/mesh')
var makeUVs = require('../geometry/uv')

// Couch width (x dimension), depth (y dimension), height (z dimension)
var CW = 2
var CD = 1
var CH = 1

module.exports = Couch

function Couch () {
  this.polys = makePolys()
  this.draw = compileDraw(this.polys)
}

Couch.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  for (var i = 0; i < this.polys.length; i++) {
    if (this.polys[i].intersect(x0, x1, y0, y1, z0, z1)) return true
  }
  return false
}

// Couch made of 8-vert polyhedra
function makePolys () {
  var polys = []
  var x, y, off

  // Pegs to stand on
  var pegUV = [0.75, 0.75, 1, 1]
  var pegUVs = [pegUV, pegUV, pegUV, pegUV, pegUV, pegUV] // all six faces solid brown
  var PEGH = 0.1
  var PEGW = 0.05
  var PEG_CW = CW * 0.98 - PEGW
  var PEG_CD = CD * 0.98 - PEGW
  for (var i = 0; i < 4; i++) {
    x = i % 2 * PEG_CW - PEG_CW / 2
    y = (i >> 1) * PEG_CD - PEG_CD / 2
    off = PEGW / 2
    polys.push(Poly8.axisAligned(x - off, y - off, 0, x + off, y + off, PEGH, pegUVs))
  }

  // Base
  var BASEH = 0.35
  var baseUVs = makeUVs(CW, CD, BASEH - PEGH, 64, 64)
  polys.push(Poly8.axisAligned(-CW / 2, -CD / 2, PEGH, CW / 2, CD / 2, BASEH, baseUVs))

  // Cushions
  var SEATH = 0.5
  var GAP = 0.02
  var SEATW = CW - 2 * GAP
  var cUVs = makeUVs(SEATW / 2, CD, SEATH - BASEH - GAP, 64, 64)
  for (i = 0; i < 2; i++) {
    // Seat cushion
    polys.push(Poly8.axisAligned(-SEATW / 2, -CD / 2, BASEH + GAP, -GAP / 2, CD / 2, SEATH, cUVs))
    polys.push(Poly8.axisAligned(GAP / 2, -CD / 2, BASEH + GAP, SEATW / 2, CD / 2, SEATH, cUVs))
  }

  // Backrest
  var YFB = -CD * 0.25 // y coordinate of front, at the bottom
  var YBB = -CD * 0.5 // back, at the bottom
  var YFT = -CD * 0.4 // front, at the top
  var YBT = -CD * 0.6 // back, at the top
  var ZB = BASEH // z coordinate of the bottom
  var ZT = CH // top of backrest = height of couch
  var backrestUVs = makeUVs(CW, CD * 0.2, CH - BASEH, 64, 64)
  polys.push(new Poly8([
    [-CW / 2, YBB, ZB],
    [-CW / 2, YBT, ZT],
    [-CW / 2, YFB, ZB],
    [-CW / 2, YFT, ZT],
    [CW / 2, YBB, ZB],
    [CW / 2, YBT, ZT],
    [CW / 2, YFB, ZB],
    [CW / 2, YFT, ZT]
  ], backrestUVs))

  // Armrests
  var armrestUVs = makeUVs(CW * 0.1, CD, CW * 0.1, 64, 64)
  // TODO: front of armrest
  for (i = 0; i < 2; i++) {
    var x0 = i === 0 ? -CW * 0.6 : CW * 0.5
    var x1 = i === 0 ? -CW * 0.5 : CW * 0.6
    var y0 = -CD * 0.5
    var y1 = CD * 0.5
    var z0 = SEATH
    var z1 = SEATH + CW * 0.1
    polys.push(Poly8.axisAligned(x0, y0, z0, x1, y1, z1, armrestUVs))
  }

  return polys
}

function compileDraw (polys) {
  var mesh = Mesh.combine(polys.map(function (poly) {
    return poly.createMesh()
  }))

  return regl({
    frag: shaders.frag.texLight,
    vert: shaders.vert.uvWorld,
    attributes: {
      aPosition: regl.buffer(mesh.verts),
      aNormal: regl.buffer(mesh.norms),
      aUV: regl.buffer(mesh.uvs)
    },
    uniforms: {
      uTexture: textures.couch
    },
    count: mesh.verts.length
  })
}
