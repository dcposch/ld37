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
var B = 0.05 // bezel is 5 cm from wall
var S = 0.04 // screen is inset, 4cm from wall

// Mounted 1m above the ground on the +Y wall
var MH = 1.0

module.exports = TV

function TV () {
  this.polys = {
    bezel: makeBezelPolys(),
    screen: makeScreenPoly()
  }
  this.draw = compileDraw(this.polys)
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

function makeScreenPoly () {
  return Poly8.axisAligned(-W / 2 + B, RW / 2 - S, MH + B, W / 2 - B, RW / 2, MH + H - B)
}

function compileDraw (polys) {
  var meshBezel = Mesh.combine(polys.bezel.map(function (poly) {
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

  var meshScreen = polys.screen.createMesh()

  var drawScreen = regl({
    frag: shaders.frag.texture,
    vert: shaders.vert.uvWorld,
    attributes: {
      aVertexPosition: regl.buffer(meshScreen.verts),
      aVertexNormal: regl.buffer(meshScreen.norms),
      aVertexUV: regl.buffer(meshScreen.uvs)
    },
    uniforms: {
      uTexture: textures.room // TODO: animate
    },
    count: meshScreen.verts.length
  })

  return function (context, props) {
    drawBezel(context, props)
    drawScreen(context, props)
  }
}
