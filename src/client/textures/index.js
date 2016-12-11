var fs = require('fs')
var {regl} = require('../env')

// Each texture returns an Image object where the src is a data URI
// That means compressed (png/gif/jpg) texture data is baked directly into bundle.js
// No extra roundtrips, no async resource loading
module.exports = {
  'room': tex('data:image/png;base64,' + fs.readFileSync(require.resolve('./square-xxl.png'), 'base64')),
  'spider': tex('data:image/png;base64,' + fs.readFileSync(require.resolve('./spider.png'), 'base64')),
  'netflix': tex('data:image/png;base64,' + fs.readFileSync(require.resolve('./netflix.png'), 'base64')),
  'smash': tex('data:image/png;base64,' + fs.readFileSync(require.resolve('./smash.png'), 'base64'))
}

function tex (dataURI) {
  return regl.texture(image(dataURI))
}

function image (dataURI) {
  var img = new window.Image()
  img.src = dataURI
  return img
}
