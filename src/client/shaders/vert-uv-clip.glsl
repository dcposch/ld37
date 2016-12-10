precision mediump float;

attribute vec2 aVertexPosition;
attribute vec2 aUV;

varying vec2 vUV;

// aVertexPosition in clip coordinates.
void main(void) {
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
  vUV = aUV;
}
