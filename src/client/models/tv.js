var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures')
var config = require('../../config')
var Poly8 = require('../geometry/poly8')
var Mesh = require('../geometry/mesh')
var makeUVs = require('../geometry/uv')

var RW = config.WORLD.ROOM_WIDTH

// TV width (x dimension), depth (y dimension), height (z dimension)
var W = 1.6
var D = 0.5
var H = 1.0

// Bezel
var B = 0.1 // bezel is 10 cm around outside of screen
var S = 0.41 // screen 41cm from wall

// Mounted 1m above the ground on the +Y wall
var MH = 1

module.exports = TV

function TV () {
  this.bezelPolys = makeBezelPolys()
  this.screen = makeScreen()
  this.draw = compileDraw(this)
}

TV.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  return false
}

function makeBezelPolys () {
  var texW = 64
  var texH = 64
  var uvsV = makeUVs(B, D, H, texW, texH) // vertical
  var uvsH = makeUVs(W - 2 * B, B, D, texW, texH) // horizontal

  var polys = []
  var YBB = RW / 2 - D + B // y coordinate back of bezel
  var YBF = RW / 2 - D // front of bezel
  polys.push(Poly8.axisAligned(-W / 2, YBF, MH, -W / 2 + B, YBB, MH + H, uvsV))
  polys.push(Poly8.axisAligned(W / 2 - B, YBF, MH, W / 2, YBB, MH + H, uvsV))
  polys.push(Poly8.axisAligned(-W / 2 + B, YBF, MH + H - B, W / 2 - B, YBB, MH + H, uvsH))
  polys.push(Poly8.axisAligned(-W / 2 + B, YBF, MH, W / 2 - B, YBB, MH + B, uvsH))
  // Make it look like a CRT
  polys.push(Poly8.axisAligned(-W / 2 + B, YBB, MH, W / 2 - B, RW / 2, MH + H - B, uvsH))
  return polys
}

function makeScreen () {
  var y = RW / 2 - S
  var x0 = -W / 2 + B
  var x1 = W / 2 - B
  var z0 = MH + H - B
  var z1 = MH + B
  var verts = [
    [x0, y, z0],
    [x0, y, z1],
    [x1, y, z0],
    [x1, y, z1]
  ]
  var normal = [0, -1, 0]
  var normals = [normal, normal, normal, normal]
  var uvs = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1]
  ]
  var elems = [0, 1, 2, 2, 1, 3]

  return {
    attributes: {
      aVertexPosition: regl.buffer(verts),
      aVertexNormal: regl.buffer(normals),
      aVertexUV: regl.buffer(uvs)
    },
    elements: regl.elements(elems)
  }
}

function compileDraw (tv) {
  var meshBezel = Mesh.combine(tv.bezelPolys.map(function (poly) {
    return poly.createMesh()
  }))

  var drawBezel = regl({
    frag: shaders.frag.texLight,
    vert: shaders.vert.uvWorld,
    attributes: {
      aVertexPosition: regl.buffer(meshBezel.verts),
      aVertexNormal: regl.buffer(meshBezel.norms),
      aVertexUV: regl.buffer(meshBezel.uvs)
    },
    uniforms: {
      uTexture: textures.wood
    },
    count: meshBezel.verts.length
  })

  var drawScreen = regl({
    frag: shaders.frag.texture,
    vert: shaders.vert.uvWorld,
    attributes: tv.screen.attributes,
    uniforms: {
      uTexture: textures.netflix
    },
    elements: tv.screen.elements,
    count: 6
  })

  return function (context, props) {
    // Animate. Figure out which frame to show
    // TODO: refactor if we need to animate anything else
    var numRows = 8
    var numCols = 4
    var numFrames = numRows * numCols
    var duration = 3 // seconds
    var mod = (context.time % (duration * 4)) / duration
    var t
    if (mod < 1) t = 0
    else if (mod < 2) t = mod - 1
    else if (mod <= 3) t = 1
    else t = 4 - mod
    var frame = Math.floor(t * numFrames)
    var u0 = (frame % numCols) / numCols
    var u1 = u0 + 1 / numCols
    var v0 = Math.floor(frame / numCols) / numRows
    var v1 = v0 + 1 / numRows
    var uvs = [
      [u0, v0],
      [u0, v1],
      [u1, v0],
      [u1, v1]
    ]
    tv.screen.attributes.aVertexUV.subdata(uvs)

    drawBezel(context, props)
    drawScreen(context, props)
  }
}
