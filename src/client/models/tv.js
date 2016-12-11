var {regl} = require('../env')
var shaders = require('../shaders')
var textures = require('../textures')
var config = require('../../config')
var Poly8 = require('../geometry/poly8')
var Mesh = require('../geometry/mesh')

var RW = config.WORLD.ROOM_WIDTH

// TV width (x dimension), depth (y dimension), height (z dimension)
var W = 1.6
var D = 0.1
var H = 1.0

// Bezel
var B = 0.05 // bezel is 5 cm around outside of screen
var S = 0.09 // screen is inset, 9cm from wall

// Mounted 1m above the ground on the +Y wall
var MH = 1

module.exports = TV

function TV () {
  this.bezelPolys = makeBezelPolys()
  this.screen = makeScreen()
  this.draw = compileDraw(this)
}

TV.prototype.intersect = function (x, y, z) {
  return false
}

function makeBezelPolys () {
  var polys = []
  polys.push(Poly8.axisAligned(-W / 2, RW / 2 - D, MH, -W / 2 + B, RW / 2, MH + H))
  polys.push(Poly8.axisAligned(W / 2 - B, RW / 2 - D, MH, W / 2, RW / 2, MH + H))
  polys.push(Poly8.axisAligned(-W / 2 + B, RW / 2 - D, MH + H - B, W / 2 - B, RW / 2, MH + H))
  polys.push(Poly8.axisAligned(-W / 2 + B, RW / 2 - D, MH, W / 2 - B, RW / 2, MH + B))
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
  // var getTriangleIndices = function (i) { return [i * 3, i * 3 + 1, i * 3 + 2] }
  var elems = [0, 1, 2, 2, 1, 3] // .map(getTriangleIndices)
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
      uTexture: textures.room
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
    var numFrames = 26
    var startTime = 3
    var duration = 3
    var t = Math.max(0, Math.min(0.9999, (context.time - startTime) / duration)) // range [0, 1)
    var frame = Math.floor(t * numFrames)
    var v0 = (numFrames - frame - 1) / numFrames
    var v1 = (numFrames - frame) / numFrames
    var uvs = [
      [0, v0],
      [0, v1],
      [1, v0],
      [1, v1]
    ]
    tv.screen.attributes.aVertexUV.subdata(uvs)

    drawBezel(context, props)
    drawScreen(context, props)
  }
}
