precision mediump float;

attribute vec3 aPosition;
attribute vec4 aColor;

uniform mat4 uMatrix;

varying vec4 vColor;

// aPosition in world coordinates.
// uMatrix is a combined projection and view matrix,
// so it transforms world to clip coordinates.
void main(void) {
  gl_Position = uMatrix * vec4(aPosition, 1.0);
  vColor = aColor;
}
