module.exports = makeUVs

// Gets texture coordinates (UVs) for a cuboid with a uniform texture
// (eg wood grain or checkered, not for eg. a six-sided dice where UV offsets matter)
function makeUVs (width, depth, height, texW, texH) {
  if (!texW || !texH) throw new Error('missing tex dims')

  // scale factor from world to texture coordinates
  var mu = 32 / texW
  var mv = 32 / texH
  return [
    [0, 0, mu * depth, mv * height], // x0 face: depth x height
    [0, 0, mu * depth, mv * height],
    [0, 0, mu * width, mv * height], // y0 face: width x height
    [0, 0, mu * width, mv * height],
    [0, 0, mu * width, mv * depth], // z0 face: width x depth
    [0, 0, mu * width, mv * depth]
  ]
}
