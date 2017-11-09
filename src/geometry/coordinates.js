var vec3 = require('gl-vec3')

module.exports = {
  toCartesian
}

// Takes spherical coordinates: azimuth, altitude, and radius
// Azimuth 0, altitude 0 points in the +X direction
// Azimuth PI/2 points in the +Y direction
// Altitude PI/2 points in the +Z direction (up)
// Returns a vec3 in cartesian coordinates
function toCartesian (azimuth, altitude, radius) {
  var x = Math.cos(azimuth) * Math.cos(altitude) * radius
  var y = Math.sin(azimuth) * Math.cos(altitude) * radius
  var z = Math.sin(altitude) * radius
  return vec3.clone([x, y, z])
}
