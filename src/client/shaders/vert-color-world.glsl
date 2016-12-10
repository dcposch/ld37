precision mediump float;

attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMatrix;

varying vec4 vColor;

// aVertexPosition in world coordinates.
// uMatrix is a combined projection and view matrix,
// so it transforms world to clip coordinates.
void main(void) {
  gl_Position = uMatrix * vec4(aVertexPosition, 1.0);
  vColor = aVertexColor;
}
