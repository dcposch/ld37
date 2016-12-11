var validate = require('./validate')
var vec3 = require('gl-vec3')
var vec2 = require('gl-vec2')

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

Mesh.prototype.copy = function () {
  var verts = this.verts.map(function (v) { return vec3.clone(v) })
  var norms = this.norms.map(function (v) { return vec3.clone(v) })
  var uvs = this.uvs ? this.uvs.map(function (v) { return vec2.clone(v) }) : null
  return new Mesh(verts, norms, uvs)
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

// Transform (translate, rotate, scale) a mesh according to a matrix
Mesh.transform = function (output, input, mat) {
  if (output.verts.length !== input.verts.length) {
    throw new Error('transform input and output meshes must be the same size')
  }
  var n = input.verts.length
  for (var i = 0; i < n; i++) {
    var vertIn = input.verts[i]
    var vertOut = output.verts[i]
    vec3.transformMat4(vertOut, vertIn, mat)
    // TODO: rotate, but don't translate or scale the norms
    // var normIn = input.norms[i]
    // var normOut = output.norms[i]]
  }
}
