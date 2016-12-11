var validate = require('./validate')

module.exports = Mesh

// Represents an mesh: vertices, normals and optionally UVs
function Mesh (verts, norms, uvs) {
  if (verts) validate(verts, 3)
  if (norms) validate(norms, 3)
  if (uvs) validate(uvs, 2)

  this.verts = verts || []
  this.norms = norms || []
  this.uvs = uvs || []
}

Mesh.combine = function (meshes) {
  var ret = new Mesh()
  meshes.forEach(function (mesh) {
    ret.verts.push(...mesh.verts)
    ret.norms.push(...mesh.norms)
    ret.uvs.push(...mesh.uvs)
  })
  return ret
}
