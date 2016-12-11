var config = require('../../config')
var shaders = require('../shaders')

var RW = config.WORLD.ROOM_WIDTH
var RH = config.WORLD.ROOM_HEIGHT

module.exports = function Room (regl) {
  this.draw = compileDraw(regl)
}

Room.prototype.intersect = function (x, y, z) {
  return z < 0 || z > RH || x < -RW / 2 || x > RW / 2 || y < -RW / 2 || y > RW / 2
}

function compileDraw () {
  // Create a room with six faces
  var verts = []
  var norms = []
  var uvs = []
  var face = [[0, 0], [0, 1], [1, 0], [1, 0], [0, 1], [1, 1]]
  for (var i = 0; i < 6; i++) {
    var nx = i >> 1 === 0 ? 1 - i % 2 * 2 : 0
    var ny = i >> 1 === 1 ? 1 - i % 2 * 2 : 0
    var nz = i >> 1 === 2 ? 1 - i % 2 * 2 : 0
    // ...each with two tris, six verts
    for (var j = 0; j < 6; j++) {
      var x = (i >> 1 === 0 ? i % 2 : face[j][0]) * RW - RW / 2
      var y = (i >> 1 === 1 ? i % 2 : face[j][i >> 2]) * RW - RW / 2
      var z = (i >> 1 === 2 ? i % 2 : face[j][1]) * RH
      verts.push([x, y, z])
      norms.push([nx, ny, nz])
      uvs.push(face[j])
    }
  }

  return regl({
    frag: shaders.frag.texLight,
    vert: shaders.vert.uvWorld,
    attributes: {
      aVertexPosition: regl.buffer(verts),
      aVertexNormal: regl.buffer(norms),
      aVertexUV: regl.buffer(uvs)
    },
    uniforms: {
      uMatrix: camera.updateMatrix,
      uTexture: textures.room,
      uLightPos: [0, 0, RH - 0.2],
      uLightColor: [1, 0.9, 0.8]
    },
    count: verts.length
  })
}
