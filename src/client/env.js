var regl = require('regl')
var canvas = document.querySelector('canvas')
module.exports = {
  canvas: canvas,
  regl: regl(canvas)
}
