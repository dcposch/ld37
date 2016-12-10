precision mediump float;

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aVertexUV;

uniform mat4 uMatrix;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

// aVertexPosition in world coordinates.
// uMatrix is a combined projection and view matrix,
// so it transforms world to clip coordinates.
void main(void) {
  gl_Position = uMatrix * vec4(aVertexPosition, 1.0);
  vUV = aVertexUV;
  vPosition = aVertexPosition;
  vNormal = aVertexNormal;
}
