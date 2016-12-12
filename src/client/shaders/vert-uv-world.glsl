precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;

uniform mat4 uMatrix;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

// aPosition in world coordinates.
// uMatrix is a combined projection and view matrix,
// so it transforms world to clip coordinates.
void main(void) {
  gl_Position = uMatrix * vec4(aPosition, 1.0);
  vUV = aUV;
  vPosition = aPosition;
  vNormal = aNormal;
}
