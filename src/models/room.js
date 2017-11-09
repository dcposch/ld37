var {regl} = require('../env')
var config = require('../config')
var shaders = require('../shaders')
var textures = require('../textures').textures
var Poly8 = require('../geometry/poly8')

var RW = config.WORLD.ROOM_WIDTH
var RH = config.WORLD.ROOM_HEIGHT

module.exports = Room

function Room () {
  this.draw = compileDraw()
}

Room.prototype.intersect = function (x0, x1, y0, y1, z0, z1) {
  return z0 < 0 || z0 > RH ||
         z1 < 0 || z1 > RH ||
    x0 < -RW / 2 || x0 > RW / 2 ||
    x1 < -RW / 2 || x1 > RW / 2 ||
    y0 < -RW / 2 || y0 > RW / 2 ||
    y1 < -RW / 2 || y1 > RW / 2
}

function compileDraw () {
  // Create a room with six faces
  var uvs = [
    [0, 0.25, 1, 0], // x0 wall: flower wallpaper
    [0, 0.5, 1, 0.25], // x1 wall: windows
    [0, 0.25, 1, 0], // y0 wall: flower wallpaper
    [0, 0.25, 1, 0], // y1 wall: flower wallpaper
    [0, 0.5, 0.5, 0.75], // z0 floor: wood floor
    [0, 0.75, 0.5, 1] // z1 ceiling: whiteish ceiling
  ]
  var poly = Poly8.axisAligned(-RW / 2, -RW / 2, 0, RW / 2, RW / 2, RH, uvs)
  var mesh = poly.createMesh()

  return regl({
    frag: shaders.frag.texLight,
    vert: shaders.vert.uvWorld,
    attributes: {
      aPosition: regl.buffer(mesh.verts),
      aNormal: regl.buffer(mesh.norms),
      aUV: regl.buffer(mesh.uvs)
    },
    uniforms: {
      uTexture: textures.room
    },
    count: mesh.verts.length
  })
}
