var fs = require('fs')
var {regl} = require('../env')
var parallel = require('run-parallel')

// Each texture returns an Image object where the src is a data URI
// That means compressed (png/gif/jpg) texture data is baked directly into bundle.js
// No extra roundtrips, no async resource loading
module.exports = {
  load: load,
  textures: {}
}

var texes = {
  'room': fs.readFileSync(require.resolve('./room.png'), 'base64'),
  'spider': fs.readFileSync(require.resolve('./spider.png'), 'base64'),
  'netflix': fs.readFileSync(require.resolve('./netflix-pink.png'), 'base64'),
  'smash': fs.readFileSync(require.resolve('./smash.png'), 'base64'),
  'couch': fs.readFileSync(require.resolve('./couch.png'), 'base64'),
  'wood': fs.readFileSync(require.resolve('./wood-dark.png'), 'base64'),
  'metal': fs.readFileSync(require.resolve('./metal.png'), 'base64'),
  'fire': fs.readFileSync(require.resolve('./fire.png'), 'base64')
}

function load (cb) {
  var tasks = {}

  Object.keys(texes).forEach(function (name) {
    tasks[name] = function (cb) {
      tex('data:image/png;base64,' + texes[name], cb)
    }
  })

  parallel(tasks, function (err, results) {
    if (err) return cb(err)
    Object.assign(module.exports.textures, results)
    cb(null)
  })
}

function tex (dataURI, cb) {
  var img = new window.Image()
  img.src = dataURI
  img.addEventListener('load', function () {
    cb(null, regl.texture(img))
  })
  img.addEventListener('error', cb)
}
