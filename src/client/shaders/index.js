var fs = require('fs')

module.exports = {
  vert: {
    uvWorld: fs.readFileSync(require.resolve('./vert-uv-world.glsl'), 'utf8'),
    uvClip: fs.readFileSync(require.resolve('./vert-uv-clip.glsl'), 'utf8'),
    colorWorld: fs.readFileSync(require.resolve('./vert-color-world.glsl'), 'utf8'),
    colorClip: fs.readFileSync(require.resolve('./vert-color-clip.glsl'), 'utf8')
  },
  frag: {
    color: fs.readFileSync(require.resolve('./frag-color.glsl'), 'utf8'),
    texture: fs.readFileSync(require.resolve('./frag-texture.glsl'), 'utf8')
  }
}
